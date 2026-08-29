import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Calculadora from './pages/Calculadora'
import ContratoView from './pages/ContratoView'
import Financeiro from './pages/Financeiro'
import Agenda from './pages/Agenda'
import TabelasOAB from './pages/TabelasOAB'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/calculadora" element={<Calculadora />} />
        <Route path="/contratos/:id" element={<ContratoView />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/tabelas-oab" element={<TabelasOAB />} />
      </Route>
    </Routes>
  )
}
