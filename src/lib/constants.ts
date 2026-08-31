export const PROCESS_AREAS = [
  { value: "civel", label: "Cível" },
  { value: "criminal", label: "Criminal" },
  { value: "tributario", label: "Tributário" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "administrativo", label: "Administrativo" },
  { value: "municipal", label: "Municipal" },
  { value: "eleitoral", label: "Eleitoral" },
  { value: "familia", label: "Família" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "sucessao", label: "Sucessão" },
  { value: "contratual", label: "Contratual" },
] as const;

export const AREA_LABEL: Record<string, string> = Object.fromEntries(
  PROCESS_AREAS.map((a) => [a.value, a.label])
);

export const URGENCY_LEVELS = [
  { value: "baixa", label: "Baixa", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "media", label: "Média", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "alta", label: "Alta", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "critica", label: "Crítica", color: "bg-red-100 text-red-800 border-red-200" },
] as const;

export const URGENCY_MAP: Record<string, (typeof URGENCY_LEVELS)[number]> = Object.fromEntries(
  URGENCY_LEVELS.map((u) => [u.value, u])
);

export const EVENT_TYPES = [
  { value: "reuniao", label: "Reunião" },
  { value: "compromisso", label: "Compromisso" },
  { value: "audiencia", label: "Audiência" },
  { value: "prazo", label: "Prazo" },
  { value: "tarefa", label: "Tarefa" },
] as const;

export const CLIENT_DOC_TYPES = [
  "RG",
  "CPF",
  "Comprovante de Residência",
  "Contrato Social",
  "CNH",
  "Certidão de Casamento",
  "Outro",
];

export const TEMPLATE_CATEGORIES = [
  { value: "peca", label: "Peça Processual" },
  { value: "contrato", label: "Contrato" },
  { value: "procuracao", label: "Procuração" },
  { value: "notificacao", label: "Notificação" },
  { value: "outro", label: "Outro" },
] as const;

export const TEMPLATE_PLACEHOLDERS = [
  { key: "cliente_nome", label: "Nome do cliente" },
  { key: "cliente_qualificacao", label: "Qualificação completa do cliente" },
  { key: "cliente_cpf_cnpj", label: "CPF/CNPJ do cliente" },
  { key: "cliente_rg", label: "RG do cliente" },
  { key: "cliente_endereco", label: "Endereço do cliente" },
  { key: "cliente_cidade", label: "Cidade do cliente" },
  { key: "cliente_estado", label: "Estado do cliente" },
  { key: "cliente_telefone", label: "Telefone do cliente" },
  { key: "cliente_email", label: "E-mail do cliente" },
  { key: "processo_numero", label: "Número do processo" },
  { key: "processo_area", label: "Área do processo" },
  { key: "processo_vara", label: "Vara/Tribunal do processo" },
  { key: "data", label: "Data atual (dd/mm/aaaa)" },
  { key: "data_extenso", label: "Data atual por extenso" },
  { key: "advogado_nome", label: "Nome do advogado" },
  { key: "advogado_oab", label: "OAB do advogado" },
  { key: "escritorio_endereco", label: "Endereço do escritório" },
] as const;

export const FIRM = {
  name: "Wilson Andrade Advocacia e Consultoria Jurídica",
  lawyer: "WILSON VERAS DE ANDRADE",
  oab: "OAB/AL 14.662",
  cpf: "084.630.434-10",
  cnpj: "64.540.896/0001-84",
  companyName: "WILSON VERAS DE ANDRADE SOCIEDADE INDIVIDUAL DE ADVOCACIA",
  address: "Av. Menino Marcelo, 9350, Empresarial Humberto Lôbo, sala 611, Serraria, Maceió/AL, CEP: 57046-000",
  city: "Maceió",
  state: "AL",
  phone: "(82) 99614-3977",
  email: "wilsonandradeadvocacia@gmail.com",
  bank: "Banco C6 S.A., Conta Corrente 41056451-6, Agência 0001, PIX chave CNPJ: 64.540.896/0001-84",
};
