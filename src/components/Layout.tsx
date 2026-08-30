import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Visão geral', end: true },
  { to: '/clientes', label: 'Clientes' },
  { to: '/calculadora', label: 'Calculadora de honorários' },
  { to: '/contratos', label: 'Contratos' },
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/tabelas-oab', label: 'Tabelas OAB' },
]

export default function Layout() {
  const { usuario, escritorio, logout } = useAuth()
  const navigate = useNavigate()

  function sair() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="no-print w-64 shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="text-lg font-serif font-semibold leading-tight">{escritorio?.nomeEscritorio || 'Escritório'}</div>
          <div className="text-xs text-brand-200">Gestão &amp; Honorários</div>
        </div>
        <nav className="flex-1 py-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white font-medium border-r-4 border-gold-500'
                    : 'text-brand-100 hover:bg-brand-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          {usuario && <div className="text-xs text-brand-100 mb-2 truncate">{usuario.nome}</div>}
          <button onClick={sair} className="text-xs text-brand-300 hover:text-white hover:underline">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}
