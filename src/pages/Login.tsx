import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 px-4">
      <div className="w-full max-w-sm card p-8">
        <h1 className="text-xl font-serif font-semibold text-brand-900 text-center">Entrar</h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">Gestão de honorários do escritório</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button type="submit" disabled={carregando} className="btn-primary w-full">
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-sm text-slate-500 text-center mt-6">
          Ainda não tem uma conta?{' '}
          <Link to="/registro" className="text-brand-600 hover:underline">
            Cadastre seu escritório
          </Link>
        </p>
      </div>
    </div>
  )
}
