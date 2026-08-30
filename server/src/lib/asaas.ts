const ASAAS_ENV = process.env.ASAAS_ENV === 'production' ? 'production' : 'sandbox'
const ASAAS_BASE_URL =
  ASAAS_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3'

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('Gateway de pagamento não configurado (ASAAS_API_KEY ausente).')
  return key
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: getApiKey(),
      ...(options.headers as Record<string, string>),
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = body?.errors?.[0]?.description || `Erro na API do Asaas (${res.status})`
    throw new Error(msg)
  }
  return body as T
}

export interface AsaasCustomer {
  id: string
  name: string
  cpfCnpj: string
  email?: string
}

export async function criarOuObterCliente(input: {
  name: string
  cpfCnpj: string
  email: string
  existingId?: string | null
}): Promise<AsaasCustomer> {
  if (input.existingId) {
    try {
      return await asaasFetch<AsaasCustomer>(`/customers/${input.existingId}`)
    } catch {
      // cliente pode ter sido removido no Asaas; recria abaixo
    }
  }
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: input.cpfCnpj.replace(/\D/g, ''),
      email: input.email,
    }),
  })
}

export interface AsaasPayment {
  id: string
  status: string
  invoiceUrl: string
}

export async function criarCobrancaUnica(input: {
  customerId: string
  valor: number
  descricao: string
}): Promise<AsaasPayment> {
  const hoje = new Date().toISOString().slice(0, 10)
  return asaasFetch<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customerId,
      billingType: 'PIX',
      value: input.valor,
      dueDate: hoje,
      description: input.descricao,
    }),
  })
}
