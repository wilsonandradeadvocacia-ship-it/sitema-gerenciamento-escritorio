import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UFS } from '../data/ufs'

export default function Registro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nomeEscritorio: '',
    nomeAdvogadoResponsavel: '',
    oabNumero: '',
    oabUf: 'SP',
    cpfCnpj: '',
    endereco: '',
    nomeUsuario: '',
    email: '',
    senha: '',
  })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await registrar(form)
      navigate('/')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao cadastrar escritório.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 px-4 py-10">
      <div className="w-full max-w-lg card p-8">
        <h1 className="text-xl font-serif font-semibold text-brand-900 text-center">Cadastrar escritório</h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-6">
          Crie a conta do seu escritório para começar a usar o sistema.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome do escritório</label>
            <input
              className="input"
              value={form.nomeEscritorio}
              onChange={(e) => set('nomeEscritorio', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Advogado(a) responsável</label>
              <input
                className="input"
                value={form.nomeAdvogadoResponsavel}
                onChange={(e) => set('nomeAdvogadoResponsavel', e.target.value)}
              />
            </div>
            <div>
              <label className="label">CPF/CNPJ</label>
              <input className="input" value={form.cpfCnpj} onChange={(e) => set('cpfCnpj', e.target.value)} />
            </div>
            <div>
              <label className="label">Nº OAB</label>
              <input className="input" value={form.oabNumero} onChange={(e) => set('oabNumero', e.target.value)} />
            </div>
            <div>
              <label className="label">UF da OAB</label>
              <select className="input" value={form.oabUf} onChange={(e) => set('oabUf', e.target.value)}>
                {UFS.map((u) => (
                  <option key={u.sigla} value={u.sigla}>
                    {u.sigla}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Endereço profissional</label>
            <input className="input" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} />
          </div>
          <hr className="border-slate-200" />
          <div>
            <label className="label">Seu nome (usuário administrador)</label>
            <input
              className="input"
              value={form.nomeUsuario}
              onChange={(e) => set('nomeUsuario', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">E-mail de acesso</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                value={form.senha}
                onChange={(e) => set('senha', e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button type="submit" disabled={carregando} className="btn-primary w-full">
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-sm text-slate-500 text-center mt-6">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
