const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const TOKEN_KEY = 'escritorio_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // sem corpo JSON
  }

  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error || `Erro na requisição (${res.status})`
    throw new ApiError(message, res.status)
  }

  return body as T
}
