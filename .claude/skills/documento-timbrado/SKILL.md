---
name: documento-timbrado
description: 'Gera qualquer documento do escritório em .docx sobre o papel timbrado oficial de WILSON ANDRADE — ADVOCACIA E CONSULTORIA JURÍDICA, já com o fecho de assinatura de WILSON VERAS DE ANDRADE, OAB/AL 14.662. Use SEMPRE que o produto final for um documento entregável a cliente, juízo, órgão público ou terceiro: petição, contestação, recurso, embargos, parecer, laudo, nota técnica, memorando, requerimento administrativo, notificação extrajudicial, contrato, procuração, declaração, ofício, carta, proposta de honorários, relatório. Acione também para pedidos como "coloca no timbrado", "gera o .docx", "manda em Word", "documento pronto pra assinar", "imprime isso", "salva como arquivo pra eu mandar pro cliente". Converte o texto produzido por qualquer outra skill jurídica (advogado-bancario-agro, advogado-eleitoral, municipalista) no arquivo final formatado — Times New Roman 11, justificado, entrelinha 1,5 — preservando intacto o timbrado (logo, marca d''água e rodapé com endereço e contato do escritório).'
---

# Documento em Papel Timbrado — Wilson Andrade Advocacia

Esta skill transforma o conteúdo jurídico já redigido no **arquivo final entregável**, sobre o papel timbrado oficial do escritório.

## Regra permanente

**Todo documento que o escritório entrega — a cliente, a juízo, a órgão público ou a terceiro — sai em papel timbrado.** Se o usuário pediu uma peça, parecer, laudo, contrato, notificação ou qualquer produto final, gere o `.docx` sem que ele precise pedir. Não se aplica a respostas de conversa, análises exploratórias, rascunhos em discussão e trechos comentados no chat: timbrado é para o documento pronto.

Na dúvida entre entregar só no chat ou gerar o arquivo, **gere o arquivo e entregue os dois** — o texto na conversa, para leitura rápida, e o `.docx` anexado.

## Dados do profissional

| Campo | Valor |
|---|---|
| Nome | **WILSON VERAS DE ANDRADE** |
| Inscrição | **OAB/AL 14.662** |
| Escritório | Wilson Andrade — Advocacia e Consultoria Jurídica |
| Endereço | Av. Menino Marcelo, 9350 — Empresarial Humberto Lôbo, sala 611 — Serraria — CEP 57046-000 — Maceió/AL |
| E-mail | wilsonandradeadvocacia@gmail.com |
| Telefone | (82) 99614-3977 |

Endereço, e-mail e telefone **já constam do rodapé impresso no timbrado** — não repita no corpo do documento, salvo quando a peça exigir a qualificação completa do advogado (procuração, contrato, endereço para intimações).

**Fecho padrão** de toda peça e parecer, alinhado à direita ou centralizado, após a data:

```
Maceió/AL, [dia] de [mês] de [ano].

**WILSON VERAS DE ANDRADE**
Advogado — OAB/AL 14.662
```

Quando a peça for de outra comarca ou o ato for praticado fora de Maceió, ajuste a cidade — o timbrado não muda.

## Como gerar

1. Escreva o conteúdo em Markdown num arquivo `.md` (use o diretório de rascunho da sessão, não o repositório).
2. Rode:

```bash
python3 .claude/skills/documento-timbrado/scripts/gerar_docx.py entrada.md "Nome do Documento.docx"
```

3. Entregue o `.docx` ao usuário com a ferramenta de envio de arquivo.

Opções:

| Flag | Efeito |
|---|---|
| `--sem-recuo` | Desliga o recuo e separa os parágrafos por espaçamento — use só em quadro, tabela densa ou documento de leitura corrida (relatório interno, proposta) |
| `--template CAMINHO` | Usa outro timbrado (ex.: papel de um cliente ou de banca parceira) |

**Padrão do escritório (já é o default, não precisa de flag):** padrão forense clássico — Times New Roman 11, justificado, entrelinha 1,5, **recuo de primeira linha de 2 cm** e sem espaço extra entre parágrafos. Linhas de campo no formato `**Consulente:** ...` ficam automaticamente rentes à margem, sem recuo.

O script usa **apenas a biblioteca padrão do Python** — não depende de python-docx, pandoc ou LibreOffice. Ele abre o template, injeta o corpo e regrava o arquivo: cabeçalhos, imagem do timbrado, margens e estilos permanecem byte a byte idênticos ao original.

## Markdown aceito

| Marcação | Resultado no documento |
|---|---|
| `# Título` | Centralizado, negrito — use para o título da peça |
| `## Seção` / `### Subseção` | Negrito, alinhado à esquerda — use para `I — DOS FATOS`, `II — DO DIREITO` |
| Parágrafo comum | Justificado, Times New Roman 11, entrelinha 1,5, recuo de 2 cm na primeira linha |
| `**negrito**`, `*itálico*` | Formatação inline |
| `- item` / `1. item` | Lista recuada |
| `\| a \| b \|` com linha `\|---\|---\|` | Tabela com bordas e cabeçalho sombreado |
| `> citação` | Bloco recuado em itálico, corpo menor — ideal para ementa e súmula |
| `[QUEBRA]` | Quebra de página |
| `---` isolado | Ignorado (serve só de separador visual no rascunho) |

## Nome do arquivo

Nomeie de forma que o cliente entenda sem abrir: `Parecer - Prorrogacao Custeio - Joao Silva.docx`, `Embargos a Execucao - Fazenda Boa Vista.docx`, `Contestacao - Busca e Apreensao - Trator.docx`. Sem acento e sem barra no nome, para não quebrar em sistemas de protocolo e em anexo de e-mail.

## Verificação antes de entregar

1. **Fecho presente** com nome e OAB corretos;
2. **Data e cidade** preenchidas — nunca entregar `[data]` no arquivo final;
3. **Nenhum colchete de template** sobrando (`[nome]`, `[valor]`) — se faltar informação do cliente, deixe o marcador **e avise o usuário na conversa** exatamente o que falta preencher;
4. **Endereçamento correto** no topo, quando for peça processual (`EXCELENTÍSSIMO(A)...`);
5. Ressalvas de conferência (jurisprudência, taxa de ciclo vigente) ficam no corpo do parecer, não em comentário solto.

## Integração com as skills jurídicas

As skills `advogado-bancario-agro`, `advogado-eleitoral` e demais skills de área produzem o **conteúdo**; esta produz o **arquivo**. O fluxo é sempre: skill de área redige → esta skill formata e entrega. Os templates daquelas skills já estão em Markdown compatível — basta preencher os campos e passar ao gerador.
