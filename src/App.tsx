import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import { AuthProvider, useAuth } from './context/AuthContext'
import { useStore } from './store/useStore'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando } = useAuth()
  const carregado = useStore((s) => s.carregado)
  const carregarTudo = useStore((s) => s.carregarTudo)

  useEffect(() => {
    if (autenticado && !carregado) {
      carregarTudo()
    }
  }, [autenticado, carregado, carregarTudo])

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>
  }
  if (!autenticado) {
    return <Navigate to="/login" replace />
  }
  if (!carregado) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando dados...</div>
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
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
