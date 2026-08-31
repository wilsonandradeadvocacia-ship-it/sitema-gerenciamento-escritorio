import { prisma } from "./prisma";

// Perfil do escritório: nome, OAB, dados usados nos documentos gerados
// (Procuração, Contrato de Honorários, modelos) e no marketing (posts,
// timbrado). Guardado como JSON na tabela genérica Setting (chave única
// "firm_profile") em vez de fixo no código — assim cada instalação do
// sistema (cada comprador) configura os próprios dados pela tela
// Configurações, sem precisar editar/redistribuir código-fonte.
export interface FirmProfile {
  name: string; // nome do escritório (marketing, timbrado, sidebar)
  lawyer: string; // advogado(a) responsável (procuração/contrato)
  oab: string;
  cpf: string;
  cnpj: string;
  companyName: string; // razão social (contrato de honorários, PJ)
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  bank: string; // dados bancários para cláusula de pagamento
  logoPath: string | null; // ícone/logo (sidebar, cards de marketing)
  logoFullPath: string | null; // logo para o cabeçalho do timbrado (.docx)
}

export const DEFAULT_FIRM: FirmProfile = {
  name: "Meu Escritório de Advocacia",
  lawyer: "Nome do(a) Advogado(a) Responsável",
  oab: "OAB/UF 000.000",
  cpf: "",
  cnpj: "",
  companyName: "",
  address: "Endereço do escritório",
  city: "Sua Cidade",
  state: "UF",
  phone: "(00) 00000-0000",
  email: "contato@seuescritorio.com.br",
  bank: "",
  logoPath: null,
  logoFullPath: null,
};

const SETTING_KEY = "firm_profile";

export async function getFirmProfile(): Promise<FirmProfile> {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return DEFAULT_FIRM;
  try {
    return { ...DEFAULT_FIRM, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT_FIRM;
  }
}

export async function setFirmProfile(partial: Partial<FirmProfile>): Promise<FirmProfile> {
  const current = await getFirmProfile();
  const next = { ...current, ...partial };
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}
