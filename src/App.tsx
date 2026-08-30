import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Calculadora from './pages/Calculadora'
import Contratos from './pages/Contratos'
import ContratoView from './pages/ContratoView'
import Financeiro from './pages/Financeiro'
import Agenda from './pages/Agenda'
import TabelasOAB from './pages/TabelasOAB'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Termos from './pages/Termos'
import Privacidade from './pages/Privacidade'
import Assinatura from './pages/Assinatura'
import AdminEscritorios from './pages/AdminEscritorios'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useStore } from './store/useStore'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando, usuario, escritorio } = useAuth()
  const carregado = useStore((s) => s.carregado)
  const carregarTudo = useStore((s) => s.carregarTudo)
  const location = useLocation()

  const bloqueado = (() => {
    if (usuario?.superAdmin || !escritorio) return false
    const trialExpirado =
      escritorio.planoStatus === 'trial' && escritorio.trialAte ? new Date(escritorio.trialAte) < new Date() : false
    return (
      escritorio.ativo === false ||
      trialExpirado ||
      escritorio.planoStatus === 'inadimplente' ||
      escritorio.planoStatus === 'cancelado'
    )
  })()

  useEffect(() => {
    if (autenticado && !carregado && !bloqueado) {
      carregarTudo()
    }
  }, [autenticado, carregado, carregarTudo, bloqueado])

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>
  }
  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  if (bloqueado && location.pathname !== '/assinatura') {
    return <Navigate to="/assinatura" replace />
  }

  if (!bloqueado && !carregado) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando dados...</div>
  }

  return <>{children}</>
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  if (!usuario?.superAdmin) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/calculadora" element={<Calculadora />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/contratos/:id" element={<ContratoView />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/tabelas-oab" element={<TabelasOAB />} />
        <Route path="/assinatura" element={<Assinatura />} />
        <Route
          path="/admin/escritorios"
          element={
            <RequireSuperAdmin>
              <AdminEscritorios />
            </RequireSuperAdmin>
          }
        />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
