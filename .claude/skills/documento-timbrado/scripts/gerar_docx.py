#!/usr/bin/env python3
"""Gera um .docx sobre o papel timbrado do escritório Wilson Andrade.

Usa apenas a biblioteca padrão. O timbrado (imagem nos cabeçalhos, margens e
tamanho de página) vem do template em assets/ e nunca é tocado: o script apenas
injeta o corpo do texto no document.xml.

Uso:
    python3 gerar_docx.py entrada.md saida.docx [--recuo] [--template CAMINHO]

Markdown aceito: # ## ### títulos, parágrafos, **negrito**, *itálico*,
listas com "-" ou "1.", tabelas com "|", citações com ">", [QUEBRA] para
quebra de página. Linhas "---" isoladas são ignoradas (separador visual).
"""

import argparse
import os
import re
import shutil
import sys
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PADRAO = os.path.join(AQUI, "..", "assets", "timbrado-wilson-andrade.docx")

FONTE = 'Times New Roman'
SZ_CORPO = 22      # meio-pontos => 11pt
SZ_TABELA = 20     # 10pt
LARGURA_UTIL = 9024  # twips: 11904 (página) - 1440 - 1440 (margens)

RFONTS = ('<w:rFonts w:ascii="{f}" w:hAnsi="{f}" w:cs="{f}" w:eastAsia="{f}"/>'
          .format(f=FONTE))


def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def runs(texto, sz=SZ_CORPO, negrito=False, italico=False):
    """Converte marcação inline (**negrito**, *itálico*) em <w:r>."""
    saida = []
    padrao = re.compile(r'(\*\*.+?\*\*|(?<!\*)\*[^*\n]+?\*(?!\*)|`[^`\n]+?`)', re.S)
    for parte in padrao.split(texto):
        if not parte:
            continue
        b, i = negrito, italico
        if parte.startswith('**') and parte.endswith('**') and len(parte) > 4:
            parte, b = parte[2:-2], True
        elif parte.startswith('*') and parte.endswith('*') and len(parte) > 2:
            parte, i = parte[1:-1], True
        elif parte.startswith('`') and parte.endswith('`') and len(parte) > 2:
            parte = parte[1:-1]
        rpr = RFONTS
        if b:
            rpr += '<w:b/>'
        if i:
            rpr += '<w:i/>'
        rpr += '<w:sz w:val="%d"/><w:szCs w:val="%d"/><w:lang w:val="pt-BR"/>' % (sz, sz)
        conteudo = ''
        for k, pedaco in enumerate(parte.split('\t')):
            if k:
                conteudo += '<w:tab/>'
            if pedaco:
                conteudo += '<w:t xml:space="preserve">%s</w:t>' % esc(pedaco)
        saida.append('<w:r><w:rPr>%s</w:rPr>%s</w:r>' % (rpr, conteudo))
    return ''.join(saida) or ('<w:r><w:rPr>%s<w:sz w:val="%d"/></w:rPr><w:t/></w:r>'
                              % (RFONTS, sz))


def paragrafo(texto, jc='both', sz=SZ_CORPO, negrito=False, italico=False,
              antes=0, depois=120, recuo=0, primeira_linha=0, linha=360,
              caixa_alta=False, quebra_antes=False):
    if caixa_alta:
        texto = texto.upper()
    ppr = '<w:pPr>'
    if quebra_antes:
        ppr += '<w:pageBreakBefore/>'
    ppr += '<w:spacing w:before="%d" w:after="%d" w:line="%d" w:lineRule="auto"/>' % (
        antes, depois, linha)
    if recuo or primeira_linha:
        ppr += '<w:ind w:left="%d" w:firstLine="%d"/>' % (recuo, primeira_linha)
    ppr += '<w:jc w:val="%s"/>' % jc
    ppr += '<w:rPr>%s<w:sz w:val="%d"/></w:rPr></w:pPr>' % (RFONTS, sz)
    return '<w:p>%s%s</w:p>' % (ppr, runs(texto, sz, negrito, italico))


def tabela(linhas):
    """linhas: lista de listas de células (a primeira é o cabeçalho)."""
    n = max(len(l) for l in linhas)
    larg = LARGURA_UTIL // n
    borda = ('<w:tblBorders>' + ''.join(
        '<w:%s w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/>' % b
        for b in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV')) +
        '</w:tblBorders>')
    xml = ('<w:tbl><w:tblPr>'
           '<w:tblW w:w="%d" w:type="dxa"/>%s'
           '<w:tblLayout w:type="fixed"/>'
           '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
           '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>'
           '</w:tblPr><w:tblGrid>%s</w:tblGrid>' % (
               LARGURA_UTIL, borda,
               ''.join('<w:gridCol w:w="%d"/>' % larg for _ in range(n))))
    for idx, linha in enumerate(linhas):
        cabecalho = idx == 0
        xml += '<w:tr>'
        if cabecalho:
            xml += '<w:trPr><w:tblHeader/></w:trPr>'
        for c in range(n):
            celula = linha[c] if c < len(linha) else ''
            sombra = ('<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>'
                      if cabecalho else '')
            xml += ('<w:tc><w:tcPr><w:tcW w:w="%d" w:type="dxa"/>%s'
                    '<w:vAlign w:val="center"/></w:tcPr>%s</w:tc>'
                    % (larg, sombra,
                       paragrafo(celula, jc='left', sz=SZ_TABELA,
                                 negrito=cabecalho, depois=0, linha=240)))
        xml += '</w:tr>'
    return xml + '</w:tbl>' + paragrafo('', depois=0, linha=240)


def separa_celulas(linha):
    linha = linha.strip()
    if linha.startswith('|'):
        linha = linha[1:]
    if linha.endswith('|'):
        linha = linha[:-1]
    return [c.strip() for c in linha.split('|')]


def eh_separador_tabela(linha):
    return bool(re.match(r'^\|?[\s:|-]+\|[\s:|-]*$', linha.strip())) and '-' in linha


def converter(md, recuo_primeira_linha=False):
    corpo = []
    linhas = md.replace('\r\n', '\n').split('\n')
    i = 0
    primeira = 567 if recuo_primeira_linha else 0
    while i < len(linhas):
        linha = linhas[i].rstrip()
        bruta = linha.strip()

        if not bruta or bruta in ('---', '***', '___'):
            i += 1
            continue

        if bruta.upper() in ('[QUEBRA]', '[QUEBRA DE PÁGINA]', '[QUEBRA DE PAGINA]'):
            corpo.append(paragrafo('', quebra_antes=True, depois=0))
            i += 1
            continue

        # tabela
        if bruta.startswith('|') and i + 1 < len(linhas) and eh_separador_tabela(linhas[i + 1]):
            dados = [separa_celulas(bruta)]
            i += 2
            while i < len(linhas) and linhas[i].strip().startswith('|'):
                dados.append(separa_celulas(linhas[i]))
                i += 1
            corpo.append(tabela(dados))
            continue

        # títulos
        m = re.match(r'^(#{1,4})\s+(.*)$', bruta)
        if m:
            nivel, texto = len(m.group(1)), m.group(2).strip()
            if nivel == 1:
                corpo.append(paragrafo(texto, jc='center', negrito=True,
                                       antes=240, depois=240, linha=276))
            elif nivel == 2:
                corpo.append(paragrafo(texto, jc='both', negrito=True,
                                       antes=240, depois=120, linha=276))
            else:
                corpo.append(paragrafo(texto, jc='both', negrito=True,
                                       antes=180, depois=100, linha=276))
            i += 1
            continue

        # citação
        if bruta.startswith('>'):
            bloco = []
            while i < len(linhas) and linhas[i].strip().startswith('>'):
                bloco.append(linhas[i].strip().lstrip('>').strip())
                i += 1
            corpo.append(paragrafo(' '.join(bloco), jc='both', italico=True,
                                   sz=SZ_TABELA, recuo=1701, linha=240, depois=160))
            continue

        # listas
        m = re.match(r'^[-*+]\s+(.*)$', bruta)
        if m:
            corpo.append(paragrafo('•\t' + m.group(1), jc='both', recuo=709,
                                   primeira_linha=0, depois=60))
            i += 1
            continue
        m = re.match(r'^(\d+[.)])\s+(.*)$', bruta)
        if m:
            corpo.append(paragrafo('%s\t%s' % (m.group(1), m.group(2)), jc='both',
                                   recuo=709, depois=60))
            i += 1
            continue

        # parágrafo comum (junta linhas seguintes do mesmo bloco)
        bloco = [bruta]
        i += 1
        while i < len(linhas):
            prox = linhas[i].strip()
            if (not prox or prox.startswith(('#', '|', '>', '-', '*', '+'))
                    or re.match(r'^\d+[.)]\s', prox) or prox in ('---', '___')):
                break
            bloco.append(prox)
            i += 1
        texto = ' '.join(bloco)
        recuado = primeira if not re.match(r'^\*\*[^*]+:\*\*', texto) else 0
        corpo.append(paragrafo(texto, jc='both', primeira_linha=recuado))
    return ''.join(corpo)


def gerar(entrada, saida, template=TEMPLATE_PADRAO, recuo=False):
    if not os.path.exists(template):
        sys.exit('Template do timbrado não encontrado: %s' % template)
    with open(entrada, encoding='utf-8') as f:
        md = f.read()
    corpo = converter(md, recuo)

    with zipfile.ZipFile(template) as z:
        itens = [(i, z.read(i.filename)) for i in z.infolist()]

    novo = []
    for info, dados in itens:
        if info.filename == 'word/document.xml':
            xml = dados.decode('utf-8')
            pos = xml.find('<w:sectPr')
            if pos < 0:
                sys.exit('sectPr não encontrado no template.')
            inicio = xml.find('<w:body>') + len('<w:body>')
            xml = xml[:inicio] + corpo + xml[pos:]
            dados = xml.encode('utf-8')
        novo.append((info, dados))

    os.makedirs(os.path.dirname(os.path.abspath(saida)) or '.', exist_ok=True)
    with zipfile.ZipFile(saida, 'w', zipfile.ZIP_DEFLATED) as z:
        for info, dados in novo:
            z.writestr(info.filename, dados)
    return saida


def main():
    p = argparse.ArgumentParser(description='Gera .docx no papel timbrado do escritório.')
    p.add_argument('entrada', help='arquivo .md com o conteúdo')
    p.add_argument('saida', help='arquivo .docx de saída')
    p.add_argument('--template', default=TEMPLATE_PADRAO, help='outro timbrado .docx')
    p.add_argument('--recuo', action='store_true',
                   help='recuo de primeira linha nos parágrafos (padrão de petição)')
    a = p.parse_args()
    print(gerar(a.entrada, a.saida, a.template, a.recuo))


if __name__ == '__main__':
    main()
