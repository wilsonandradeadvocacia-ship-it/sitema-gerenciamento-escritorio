import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Visão geral', end: true },
  { to: '/clientes', label: 'Clientes' },
  { to: '/calculadora', label: 'Calculadora de honorários' },
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/tabelas-oab', label: 'Tabelas OAB' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="no-print w-64 shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="text-lg font-serif font-semibold leading-tight">Escritório</div>
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
        <div className="px-5 py-4 text-[11px] text-brand-300 border-t border-white/10">
          Dados salvos localmente neste navegador.
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-slate-50">
        <Outlet />
      </main>
    </div>
  )
}
