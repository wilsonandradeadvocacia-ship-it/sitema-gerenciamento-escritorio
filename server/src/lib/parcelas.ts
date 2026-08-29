import { v4 as uuid } from 'uuid'

export interface ParcelaContrato {
  id: string
  numero: number
  descricao: string
  valor: number
  dataVencimento: string
  status: 'previsto' | 'recebido' | 'atrasado'
  dataRecebimento?: string
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function gerarParcelas(
  valorTotal: number,
  numeroParcelas: number,
  primeiraData: string,
  formaPagamento: 'avista' | 'parcelado' | 'mensal_continuado',
): ParcelaContrato[] {
  const n = Math.max(1, numeroParcelas)
  const valorParcela = Math.round((valorTotal / n) * 100) / 100
  const parcelas: ParcelaContrato[] = []
  let somaAcumulada = 0
  for (let i = 0; i < n; i++) {
    const isUltima = i === n - 1
    const valor = isUltima ? Math.round((valorTotal - somaAcumulada) * 100) / 100 : valorParcela
    somaAcumulada += valor
    parcelas.push({
      id: uuid(),
      numero: i + 1,
      descricao:
        formaPagamento === 'mensal_continuado'
          ? `Mensalidade ${i + 1}`
          : n === 1
          ? 'Pagamento único'
          : `Parcela ${i + 1}/${n}`,
      valor,
      dataVencimento: addMonths(primeiraData, i),
      status: 'previsto',
    })
  }
  return parcelas
}
