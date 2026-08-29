// Dados extraídos por pesquisa em fontes oficiais (PDFs das tabelas de honorários das
// seccionais) e, em alguns itens, de fontes secundárias quando o PDF oficial não pôde
// ser confirmado diretamente. Cada item de confiança "media" ou "baixa" carrega uma
// observação recomendando a conferência do valor oficial vigente antes do uso.
// Ainda assim, TODOS os valores devem ser periodicamente revalidados pelo escritório,
// pois as tabelas são reajustadas com frequência (mensal, em alguns casos, via URH/UAD).

interface RawItem {
  categoria: string
  tipo: string
  valorFixo?: number
  valorMin?: number
  valorMax?: number
  percFixo?: number
  percMin?: number
  percMax?: number
  valorMinimoAbsoluto?: number
  obs?: string
  confianca?: 'alta' | 'media' | 'baixa'
}

interface RawTabela {
  uf: string
  nomeSeccional: string
  vigencia: string
  fonteUrl: string
  itens: RawItem[]
}

export const TABELAS_PESQUISADAS_RAW: RawTabela[] = [
  {
    uf: 'SP',
    nomeSeccional: 'OAB/SP',
    vigencia: '2024',
    fonteUrl: 'https://www2.oabsp.org.br/asp/dotnet/Index/tabelas/OAB-SP-tabela-de-honorarios-2024.pdf',
    itens: [
      { categoria: 'Consulta verbal/simples', tipo: 'fixo', valorFixo: 516.47 },
      { categoria: 'Parecer ou memorial escrito simples', tipo: 'fixo', valorFixo: 1000.0 },
      { categoria: 'Parecer ou memorial escrito complexo', tipo: 'fixo', valorFixo: 2000.0 },
      {
        categoria: 'Elaboração de contrato/estatuto (ex.: holding)',
        tipo: 'percentual',
        percFixo: 3,
        valorMinimoAbsoluto: 4722.0,
        obs: 'Vale o maior entre 3% do valor do negócio e o piso de R$ 4.722,00.',
      },
      {
        categoria: 'Ação cível - procedimento comum (regra geral)',
        tipo: 'percentual',
        percMin: 10,
        percMax: 20,
        obs: '% sobre o valor econômico real da questão.',
      },
      {
        categoria: 'Reclamação trabalhista - patrocínio do reclamante',
        tipo: 'percentual_exito',
        percMin: 20,
        percMax: 30,
        valorMinimoAbsoluto: 1737.91,
        confianca: 'media',
      },
      {
        categoria: 'Reclamação trabalhista - patrocínio do reclamado',
        tipo: 'percentual',
        percMin: 20,
        percMax: 30,
        valorMinimoAbsoluto: 4344.8,
        confianca: 'media',
      },
      { categoria: 'Divórcio/dissolução de união estável consensual', tipo: 'fixo', valorMin: 144.38, valorMax: 481.27 },
      { categoria: 'Divórcio/dissolução de união estável litigioso', tipo: 'fixo', valorMin: 206.25, valorMax: 687.49 },
      {
        categoria: 'Ação de alimentos (fixação/revisão/exoneração)',
        tipo: 'fixo',
        valorFixo: 1333.38,
        obs: 'Piso mínimo; a tabela usa como referência o equivalente a 3 meses da pensão fixada/exonerada quando superior a este piso.',
      },
      { categoria: 'Defesa criminal (rito ordinário/sumário/especial)', tipo: 'fixo', valorFixo: 2666.74 },
      { categoria: 'Defesa em processo do júri (até julgamento em plenário)', tipo: 'fixo', valorFixo: 6666.86 },
      {
        categoria: 'Inventário extrajudicial',
        tipo: 'percentual',
        percFixo: 6,
        valorMinimoAbsoluto: 4161.27,
        obs: '% sobre o monte-mor.',
      },
      {
        categoria: 'Inventário judicial sem litígio',
        tipo: 'percentual',
        percFixo: 8,
        valorMinimoAbsoluto: 5825.77,
        obs: '% sobre o monte-mor.',
      },
      {
        categoria: 'Inventário judicial com litígio',
        tipo: 'percentual',
        percFixo: 10,
        valorMinimoAbsoluto: 5825.77,
        obs: '% sobre o monte-mor.',
      },
      { categoria: 'Execução de título extrajudicial / embargos', tipo: 'fixo', valorFixo: 550.0 },
      {
        categoria: 'Recurso (apelação/agravo de instrumento)',
        tipo: 'percentual',
        percFixo: 20,
        obs: '% sobre o valor da causa; reduzido em 50% se o advogado atuou apenas na fase recursal.',
      },
      { categoria: 'Juizado Especial Cível (1ª instância)', tipo: 'fixo', valorFixo: 222.29 },
      { categoria: 'Habeas corpus (isolado, qualquer instância)', tipo: 'fixo', valorMin: 171.88, valorMax: 572.92 },
      { categoria: 'Mandado de segurança (matéria administrativa)', tipo: 'fixo', valorMin: 165.0, valorMax: 550.0 },
      {
        categoria: 'Mandado de segurança (matéria cível)',
        tipo: 'percentual',
        percFixo: 20,
        valorMinimoAbsoluto: 6658.02,
      },
      {
        categoria: 'Consultoria/assessoria mensal (contrato continuado)',
        tipo: 'hora',
        valorFixo: 2815.24,
        obs: 'Valor mensal de referência.',
      },
    ],
  },
  {
    uf: 'RJ',
    nomeSeccional: 'OAB/RJ',
    vigencia: '2024',
    fonteUrl: 'https://www.oabrj.org.br/sites/default/files/tabela_site_01_2024.pdf',
    itens: [
      { categoria: 'Hora do advogado (contratação avulsa)', tipo: 'hora', valorFixo: 173.98, obs: 'Valor por hora.' },
      {
        categoria: 'Consultoria/assessoria mensal (até 20h semanais)',
        tipo: 'hora',
        valorFixo: 1391.81,
      },
      { categoria: 'Audiência avulsa', tipo: 'fixo', valorFixo: 265.74 },
      { categoria: 'Juizado Especial Cível (1ª instância)', tipo: 'fixo', valorFixo: 1043.86 },
      {
        categoria: 'Recurso de apelação',
        tipo: 'fixo',
        valorFixo: 6600.0,
        obs: 'Reduzido em 50% se o advogado atuou apenas na fase recursal.',
      },
      {
        categoria: 'Ação cível com proveito econômico (dano moral etc.)',
        tipo: 'percentual_exito',
        percMin: 0,
        percMax: 30,
        obs: 'Até 30% do resultado econômico obtido (percentual mínimo não fixado na tabela).',
      },
      {
        categoria: 'Inventário - adicional ao advogado da parte vencedora',
        tipo: 'percentual',
        percFixo: 8,
        obs: '% sobre o quinhão hereditário.',
      },
      {
        categoria: 'Mandado de segurança',
        tipo: 'fixo',
        valorMin: 2329.63,
        valorMax: 16665.8,
        confianca: 'media',
      },
    ],
  },
  {
    uf: 'MG',
    nomeSeccional: 'OAB/MG',
    vigencia: '2023',
    fonteUrl: 'https://www.oabmg.org.br/doc/Tabela_Honorarios_Advocaticios_2023.pdf',
    itens: [
      { categoria: 'Ação cível contenciosa (regra geral)', tipo: 'percentual', percFixo: 10, obs: '% sobre o valor econômico real da causa.' },
      { categoria: 'Ação administrativa (regra geral)', tipo: 'percentual', percFixo: 5 },
      {
        categoria: 'Inventário consensual/arrolamento',
        tipo: 'percentual',
        percFixo: 8,
        valorMinimoAbsoluto: 7000.0,
      },
      {
        categoria: 'Inventário litigioso',
        tipo: 'percentual',
        percFixo: 10,
        valorMinimoAbsoluto: 7000.0,
      },
      { categoria: 'Conversão de separação em divórcio', tipo: 'fixo', valorFixo: 5000.0 },
      {
        categoria: 'Reclamatória trabalhista - reclamante',
        tipo: 'percentual_exito',
        percFixo: 20,
        valorMinimoAbsoluto: 3000.0,
        confianca: 'baixa',
      },
      { categoria: 'Reclamatória trabalhista - reclamado', tipo: 'percentual', percFixo: 20 },
      { categoria: 'Habeas corpus', tipo: 'fixo', valorFixo: 3000.0, confianca: 'baixa' },
      { categoria: 'Mandado de segurança', tipo: 'fixo', valorFixo: 6000.0, confianca: 'baixa' },
      { categoria: 'Execução', tipo: 'fixo', valorFixo: 3000.0, confianca: 'baixa' },
      { categoria: 'Ação de alimentos', tipo: 'fixo', valorFixo: 2000.0, confianca: 'baixa' },
      { categoria: 'Guarda / interdição / tutela / curatela', tipo: 'fixo', valorFixo: 3000.0, confianca: 'baixa' },
    ],
  },
  {
    uf: 'RS',
    nomeSeccional: 'OAB/RS',
    vigencia: '2022–2026 (itens de fontes distintas, ver observações)',
    fonteUrl: 'https://admsite.oabrs.org.br/arquivos/honorarios-versao-2026.pdf',
    itens: [
      { categoria: 'Ação cível contenciosa (regra geral)', tipo: 'percentual', percFixo: 10 },
      { categoria: 'Ação administrativa (regra geral)', tipo: 'percentual', percFixo: 5 },
      { categoria: 'Consulta em condições normais', tipo: 'fixo', valorFixo: 446.65, confianca: 'baixa', obs: 'Valor da tabela de 2022; pode estar desatualizado.' },
      { categoria: 'Consulta em condições excepcionais', tipo: 'fixo', valorFixo: 1116.65, confianca: 'baixa', obs: 'Valor da tabela de 2022; pode estar desatualizado.' },
      { categoria: 'Habeas corpus autônomo (trancamento de ação penal)', tipo: 'fixo', valorFixo: 8000.0, confianca: 'baixa' },
      { categoria: 'Mandado de segurança contra ato jurisdicional penal', tipo: 'fixo', valorFixo: 8000.0, confianca: 'baixa' },
      { categoria: 'Habeas corpus perante Tribunais Superiores', tipo: 'fixo', valorFixo: 30000.0, confianca: 'baixa' },
      { categoria: 'Mandado de segurança perante Tribunais Superiores', tipo: 'fixo', valorFixo: 23530.0, confianca: 'baixa' },
    ],
  },
  {
    uf: 'PE',
    nomeSeccional: 'OAB/PE',
    vigencia: '2025',
    fonteUrl: 'https://www.oabpe.org.br/files/institutional/17359095871803-item5extraordinriatabeladehonorrios2025.pdf',
    itens: [
      {
        categoria: 'Serviços não previstos especificamente (regra geral)',
        tipo: 'percentual',
        percMin: 10,
        percMax: 30,
      },
      {
        categoria: 'Inventário - advogado de herdeiros',
        tipo: 'percentual',
        percMin: 10,
        percMax: 15,
        valorMinimoAbsoluto: 800.0,
        obs: '% sobre o valor do quinhão ou legado.',
      },
      { categoria: 'Inventário negativo', tipo: 'fixo', valorFixo: 800.0 },
      { categoria: 'Divórcio', tipo: 'fixo', valorFixo: 500.0, obs: 'Valor mínimo; casos litigiosos/com bens tendem a exigir valor superior.' },
      { categoria: 'Separação judicial consensual sem bens', tipo: 'fixo', valorFixo: 700.0 },
      {
        categoria: 'Separação judicial com bens',
        tipo: 'percentual',
        percMin: 10,
        percMax: 20,
        valorMinimoAbsoluto: 800.0,
        obs: '% sobre o valor real do monte.',
      },
    ],
  },
  {
    uf: 'CE',
    nomeSeccional: 'OAB-CE',
    vigencia: '2023–2024',
    fonteUrl: 'https://oabce.org.br/wp-content/uploads/2024/05/TABELA-DE-HONORARIOS-23032023.pdf',
    itens: [
      { categoria: 'Habeas corpus perante juízo de 1º grau', tipo: 'fixo', valorFixo: 4867.38 },
      { categoria: 'Habeas corpus perante o STF', tipo: 'fixo', valorFixo: 9734.75 },
      { categoria: 'Recurso ordinário constitucional em habeas corpus', tipo: 'fixo', valorFixo: 7956.69 },
      { categoria: 'Conversão de separação judicial em divórcio', tipo: 'fixo', valorFixo: 3122.1 },
      { categoria: 'Ação direta de inconstitucionalidade (representação)', tipo: 'fixo', valorFixo: 3858.39 },
    ],
  },
  {
    uf: 'PR',
    nomeSeccional: 'OAB/PR',
    vigencia: '2026',
    fonteUrl: 'https://www.oabpr.org.br/wp-content/uploads/2026/04/Tabela-de-Honorarios-2026-1.pdf',
    itens: [
      { categoria: 'Ação cível contenciosa (regra geral)', tipo: 'percentual', percFixo: 10 },
      { categoria: 'Ação administrativa (regra geral)', tipo: 'percentual', percFixo: 5 },
    ],
  },
  {
    uf: 'BA',
    nomeSeccional: 'OAB-BA',
    vigencia: 'Agosto/2026',
    fonteUrl: 'https://adm.oab-ba.org.br/arquivos/oab_honorarios/32/ARQUIVO_HONORARIO.pdf',
    itens: [
      { categoria: 'Ação cível contenciosa (regra geral)', tipo: 'percentual', percFixo: 10 },
      { categoria: 'Ação administrativa (regra geral)', tipo: 'percentual', percFixo: 5 },
    ],
  },
  {
    uf: 'SC',
    nomeSeccional: 'OAB/SC',
    vigencia: '2025–2026 (Resolução CP nº 03/2026)',
    fonteUrl: 'https://oab-sc.org.br/honorarios',
    itens: [
      { categoria: 'Consulta em condições normais', tipo: 'fixo', valorFixo: 455.79 },
      { categoria: 'Consulta em condições excepcionais', tipo: 'fixo', valorFixo: 781.35 },
      { categoria: 'Consulta no domicílio/empresa do cliente', tipo: 'fixo', valorFixo: 520.9 },
    ],
  },
]
