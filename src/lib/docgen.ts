import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  ImageRun,
  BorderStyle,
  Packer,
} from "docx";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { getFirmProfile, FirmProfile } from "./firm";
import { convertToPdf } from "./soffice";

const GEN_ROOT = path.join(process.cwd(), "public", "uploads", "gerados");

function p(text: string, opts: { bold?: boolean; italics?: boolean; size?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number } = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.spacingAfter ?? 200, line: 300 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22,
        font: "Georgia",
      }),
    ],
  });
}

function heading(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300, before: 100 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Georgia" })],
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    spacing: { after: 150, before: 250 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Georgia" })],
  });
}

async function buildHeader(firm: FirmProfile) {
  const fs = await import("fs/promises");
  let imageBuffer: Buffer | null = null;
  if (firm.logoFullPath) {
    try {
      imageBuffer = await fs.readFile(path.join(process.cwd(), "public", firm.logoFullPath.replace(/^\/+/, "")));
    } catch {
      imageBuffer = null;
    }
  }
  const children = [];
  if (imageBuffer) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: { width: 190, height: 97 },
            type: "jpg",
          }),
        ],
      })
    );
  }
  return new Header({ children });
}

function buildFooter(firm: FirmProfile) {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "B8935C", space: 6 } },
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [
          new TextRun({
            text: `${firm.address}`,
            size: 15,
            color: "555555",
            font: "Georgia",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${firm.email} | ${firm.phone}`,
            size: 15,
            color: "555555",
            font: "Georgia",
          }),
        ],
      }),
    ],
  });
}

export async function renderLetterheadDocx(title: string, bodyParagraphs: Paragraph[], firm: FirmProfile): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1600, bottom: 1200, left: 1300, right: 1300 },
          },
        },
        headers: { default: await buildHeader(firm) },
        footers: { default: buildFooter(firm) },
        children: [heading(title), ...bodyParagraphs],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

export async function saveGeneratedDoc(buffer: Buffer, baseName: string): Promise<{ docxPath: string; pdfPath: string | null }> {
  await mkdir(GEN_ROOT, { recursive: true });
  const id = uuid();
  const fileName = `${baseName}-${id}.docx`;
  const fullPath = path.join(GEN_ROOT, fileName);
  await writeFile(fullPath, buffer);

  const pdfFullPath = await convertToPdf(fullPath, GEN_ROOT);
  const pdfPath = pdfFullPath ? `/uploads/gerados/${path.basename(pdfFullPath)}` : null;

  return { docxPath: `/uploads/gerados/${fileName}`, pdfPath };
}

// ---------------- PROCURAÇÃO ----------------

export interface ProcuracaoData {
  clientName: string;
  clientQualification: string;
  powers: string;
  scopeText?: string;
  city?: string;
}

export async function buildProcuracaoDocx(data: ProcuracaoData): Promise<Buffer> {
  const firm = await getFirmProfile();
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const body: Paragraph[] = [
    sectionTitle("OUTORGANTE:"),
    p(`${data.clientQualification}`),
    sectionTitle("OUTORGADO:"),
    p(
      `${firm.lawyer}, brasileiro, advogado, inscrito na ${firm.oab}, com escritório jurídico localizado em ${firm.address}.`
    ),
    sectionTitle("PODERES:"),
    p(
      `Os da cláusula "Ad Judicia et Extra" e mais os especiais para transigir, desistir, firmar compromisso, receber e dar quitação, substabelecer com ou sem reserva de poderes, para representar o(a) outorgante judicialmente ou extrajudicialmente, defendendo seus interesses e direitos em qualquer Juízo, grau e instância, bem como representar o(a) outorgante junto a qualquer repartição pública, estadual, municipal, federal ou particular.${
        data.scopeText ? ` ${data.scopeText}` : ""
      }`
    ),
    p(`${data.city ?? firm.city}, ${dateStr}.`, { align: AlignmentType.RIGHT, spacingAfter: 800 }),
    p(data.clientName, { align: AlignmentType.CENTER, bold: true, spacingAfter: 0 }),
    p("Outorgante", { align: AlignmentType.CENTER, italics: true }),
  ];
  return renderLetterheadDocx("INSTRUMENTO PARTICULAR DE PROCURAÇÃO", body, firm);
}

// ---------------- CONTRATO DE HONORÁRIOS ----------------

export interface ContratoData {
  clientName: string;
  clientQualification: string;
  objectText: string;
  paymentType: "mensal" | "avista" | "parcelado" | "exito" | "hora";
  totalValue?: number;
  installments?: number;
  installmentValue?: number;
  dueDay?: number;
  successFeePct?: number;
  bankInfo?: string;
  startDate?: Date;
  city?: string;
}

function fmtBRL(v?: number) {
  if (v == null) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function paymentClause(data: ContratoData, firm: FirmProfile): string {
  const bank = data.bankInfo || firm.bank;
  switch (data.paymentType) {
    case "avista":
      return `Fica estabelecido o pagamento à vista no valor de ${fmtBRL(data.totalValue)}, a ser quitado mediante crédito na seguinte conta bancária: ${bank}.`;
    case "parcelado":
      return `Fica estabelecido o pagamento do valor total de ${fmtBRL(data.totalValue)}, dividido em ${data.installments ?? 1} (${data.installments ?? 1}) parcelas de ${fmtBRL(
        data.installmentValue
      )}, a serem pagas todo dia ${data.dueDay ?? 10} de cada mês, mediante crédito na seguinte conta bancária: ${bank}.`;
    case "mensal":
      return `Fica estabelecida a contraprestação mensal de ${fmtBRL(data.installmentValue ?? data.totalValue)}, a serem pagos todo dia ${
        data.dueDay ?? 10
      } de cada mês, mediante crédito na seguinte conta bancária: ${bank}.`;
    case "exito":
      return `A CONTRATADA fará jus a honorários de êxito no percentual de ${data.successFeePct ?? 20}% (${
        data.successFeePct ?? 20
      } por cento) sobre o proveito econômico obtido, a serem pagos mediante crédito na seguinte conta bancária: ${bank}.`;
    case "hora":
      return `Fica estabelecido o pagamento por hora técnica no valor de ${fmtBRL(data.installmentValue)}, mediante crédito na seguinte conta bancária: ${bank}, conforme relatório mensal de horas.`;
    default:
      return "";
  }
}

export async function buildContratoDocx(data: ContratoData): Promise<Buffer> {
  const firm = await getFirmProfile();
  const start = data.startDate ?? new Date();
  const dateStr = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const body: Paragraph[] = [
    p(`CONTRATANTE: ${data.clientQualification}`),
    p(
      `CONTRATADO: ${firm.companyName || firm.name}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${firm.cnpj}, com escritório profissional na ${firm.address}, neste ato representada por seu sócio, ${firm.lawyer}, brasileiro, advogado inscrito na ${firm.oab}, inscrito no CPF/MF sob o nº ${firm.cpf}.`
    ),
    p("As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Honorários Advocatícios, que se regerá pelas condições descritas no presente."),

    sectionTitle("DO OBJETO DO CONTRATO"),
    p(`Cláusula 1ª. ${data.objectText}`),

    sectionTitle("DAS DESPESAS"),
    p(
      "Cláusula 2ª. Todas as despesas processuais e extraprocessuais, incluindo-se fotocópias e viagens, ficarão a cargo do CONTRATANTE, excetuando-se os honorários advocatícios ora pactuados, salvo disposição em contrário."
    ),

    sectionTitle("DA COBRANÇA"),
    p("Cláusula 3ª. As partes acordam que é facultado ao CONTRATADO o direito de realizar a cobrança dos honorários por todos os meios admitidos em direito."),

    sectionTitle("DO PRAZO E DOS HONORÁRIOS"),
    p(`Cláusula 4ª. O presente contrato terá vigência a partir de ${dateStr}, permanecendo válido até a conclusão do serviço contratado ou rescisão nos termos deste instrumento.`),
    p(`Cláusula 5ª. ${paymentClause(data, firm)}`),

    sectionTitle("DA RESCISÃO"),
    p(
      "Cláusula 6ª. As partes poderão, de comum acordo ou não, rescindir a qualquer tempo o presente contrato, sem pagamento de multa contratual, respeitando comunicação prévia de 30 (trinta) dias. Ficarão respeitados os honorários contratuais e sucumbenciais relativos aos serviços já prestados até o término da relação contratual."
    ),

    sectionTitle("DAS DISPOSIÇÕES GERAIS"),
    p(
      "Cláusula 7ª. Este contrato enquadra-se no rol dos títulos executivos extrajudiciais, nos termos do artigo 784, Inciso XII, do Código de Processo Civil, combinado com o artigo 24 da Lei 8.906/94 (EOAB). Em caso de atraso, serão cobrados juros de mora na razão de 1% (um por cento) ao mês, além de correção monetária."
    ),

    sectionTitle("DA COMUNICAÇÃO"),
    p(
      `Cláusula 8ª. O CONTRATANTE se compromete a manter atualizados os meios de contato ora avençados para a boa comunicação das partes, através do telefone ${firm.phone} e e-mail ${firm.email}.`
    ),

    sectionTitle("DO FORO"),
    p(`Cláusula 9ª. Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da comarca de ${data.city ?? firm.city}-${firm.state}, renunciando a qualquer outro por mais privilegiado que seja.`),

    p("Por estarem assim justos e contratados, firmam o presente instrumento.", { spacingAfter: 600 }),
    p(`${data.city ?? firm.city}, ${dateStr}.`, { align: AlignmentType.RIGHT, spacingAfter: 800 }),
    p(data.clientName, { align: AlignmentType.CENTER, bold: true, spacingAfter: 0 }),
    p("Contratante", { align: AlignmentType.CENTER, italics: true, spacingAfter: 600 }),
    p(firm.companyName || firm.name, { align: AlignmentType.CENTER, bold: true, spacingAfter: 0 }),
    p("Contratada", { align: AlignmentType.CENTER, italics: true }),
  ];

  return renderLetterheadDocx("CONTRATO DE HONORÁRIOS ADVOCATÍCIOS", body, firm);
}

export function buildClientQualification(client: {
  kind: string;
  name: string;
  cpfCnpj?: string | null;
  rg?: string | null;
  maritalStatus?: string | null;
  profession?: string | null;
  nationality?: string | null;
  legalRepName?: string | null;
  legalRepCpf?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string {
  if (client.kind === "PJ") {
    return `${client.name}, pessoa jurídica${client.cpfCnpj ? `, inscrita no CNPJ/MF sob o nº ${client.cpfCnpj}` : ""}${
      client.address ? `, situada em ${client.address}${client.city ? `, ${client.city}/${client.state ?? ""}` : ""}${client.zip ? `, CEP: ${client.zip}` : ""}` : ""
    }${client.legalRepName ? `, neste ato representada por ${client.legalRepName}${client.legalRepCpf ? `, inscrito(a) no CPF/MF sob o nº ${client.legalRepCpf}` : ""}` : ""}.`;
  }
  return `${client.name}, ${client.nationality ?? "brasileiro(a)"}${client.maritalStatus ? `, ${client.maritalStatus.toLowerCase()}` : ""}${
    client.profession ? `, ${client.profession.toLowerCase()}` : ""
  }${client.cpfCnpj ? `, inscrito(a) no CPF/MF sob o nº ${client.cpfCnpj}` : ""}${client.rg ? `, portador(a) do RG nº ${client.rg}` : ""}${
    client.address ? `, residente e domiciliado(a) em ${client.address}${client.city ? `, ${client.city}/${client.state ?? ""}` : ""}${client.zip ? `, CEP: ${client.zip}` : ""}` : ""
  }.`;
}
