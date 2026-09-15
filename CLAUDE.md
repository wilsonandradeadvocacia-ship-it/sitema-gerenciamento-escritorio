# Escritório Wilson Andrade — Advocacia e Consultoria Jurídica

## Profissional responsável

- **WILSON VERAS DE ANDRADE** — **OAB/AL 14.662**
- Av. Menino Marcelo, 9350 — Empresarial Humberto Lôbo, sala 611 — Serraria — CEP 57046-000 — Maceió/AL
- wilsonandradeadvocacia@gmail.com — (82) 99614-3977

## Regra permanente: todo documento sai em papel timbrado

Sempre que o produto final for um **documento entregável** — petição, contestação, recurso, embargos, parecer, laudo, nota técnica, requerimento administrativo, notificação extrajudicial, contrato, procuração, declaração, ofício, carta, proposta de honorários, relatório —, gere o arquivo `.docx` sobre o papel timbrado do escritório e entregue-o ao usuário, **sem que ele precise pedir**.

Use a skill **`documento-timbrado`**:

```bash
python3 .claude/skills/documento-timbrado/scripts/gerar_docx.py entrada.md "Nome do Documento.docx"
```

O timbrado oficial fica em `.claude/skills/documento-timbrado/assets/timbrado-wilson-andrade.docx` e não deve ser alterado.

**Formatação padrão do escritório:** padrão forense clássico — Times New Roman 11, justificado, entrelinha 1,5, recuo de primeira linha de 2 cm e sem espaço extra entre parágrafos. Já é o comportamento default do gerador; só desligue com `--sem-recuo` em documento de leitura corrida (relatório interno, proposta comercial).

Toda peça e todo parecer fecham com:

```
Maceió/AL, [dia] de [mês] de [ano].

WILSON VERAS DE ANDRADE
Advogado — OAB/AL 14.662
```

Não se aplica a respostas de conversa, análises exploratórias e rascunhos em discussão — timbrado é para o documento pronto. Na dúvida, entregue os dois: o texto no chat e o `.docx` anexado.

## Skills do escritório

| Skill | Quando usa |
|---|---|
| `advogado-bancario-agro` | Crédito rural, financiamento agrícola, contratos do agro, revisional bancária, execução, programas governamentais |
| `advogado-eleitoral` | Direito eleitoral, campanha, propaganda, contencioso no TRE-MA/TSE |
| `documento-timbrado` | Formatação e entrega de qualquer documento final em `.docx` |

As skills de área produzem o **conteúdo**; `documento-timbrado` produz o **arquivo**.

## Sistema de gestão (código)

O repositório também abriga o sistema de gestão do escritório (React + TypeScript no `src/`, Node + Express + Prisma no `server/`). Ver `README.md` para instalação e deploy.
