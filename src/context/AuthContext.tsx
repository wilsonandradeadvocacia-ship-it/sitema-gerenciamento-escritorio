import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, clearToken, getToken, setToken } from '../api/client'
import { useStore } from '../store/useStore'
import type { EscritorioConfig } from '../types'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
}

interface RegistroInput {
  nomeEscritorio: string
  nomeAdvogadoResponsavel: string
  oabNumero: string
  oabUf: string
  cpfCnpj: string
  endereco: string
  nomeUsuario: string
  email: string
  senha: string
}

interface AuthContextValue {
  usuario: Usuario | null
  escritorio: EscritorioConfig | null
  carregando: boolean
  autenticado: boolean
  login: (email: string, senha: string) => Promise<void>
  registrar: (input: RegistroInput) => Promise<void>
  logout: () => void
  atualizarEscritorio: (patch: Partial<EscritorioConfig>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [escritorio, setEscritorio] = useState<EscritorioConfig | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregarSessao = useCallback(async () => {
    if (!getToken()) {
      setCarregando(false)
      return
    }
    try {
      const data = await apiFetch<{ user: Usuario; escritorio: EscritorioConfig }>('/api/auth/me')
      setUsuario(data.user)
      setEscritorio(data.escritorio)
    } catch {
      clearToken()
      setUsuario(null)
      setEscritorio(null)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarSessao()
  }, [carregarSessao])

  async function login(email: string, senha: string) {
    const data = await apiFetch<{ token: string; user: Usuario; escritorio: EscritorioConfig }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    setToken(data.token)
    setUsuario(data.user)
    setEscritorio(data.escritorio)
  }

  async function registrar(input: RegistroInput) {
    const data = await apiFetch<{ token: string; user: Usuario; escritorio: EscritorioConfig }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setToken(data.token)
    setUsuario(data.user)
    setEscritorio(data.escritorio)
  }

  function logout() {
    clearToken()
    setUsuario(null)
    setEscritorio(null)
    useStore.getState().limpar()
  }

  async function atualizarEscritorio(patch: Partial<EscritorioConfig>) {
    const atualizado = await apiFetch<EscritorioConfig>('/api/escritorio', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    setEscritorio(atualizado)
  }

  return (
    <AuthContext.Provider
      value={{ usuario, escritorio, carregando, autenticado: !!usuario, login, registrar, logout, atualizarEscritorio }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
