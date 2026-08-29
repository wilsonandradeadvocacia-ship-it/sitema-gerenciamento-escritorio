import { useState } from 'react'
import { useStore } from '../store/useStore'
import { UFS } from '../data/ufs'
import type { Cliente, PessoaTipo } from '../types'
import { formatDate } from '../lib/format'

const vazio: Omit<Cliente, 'id' | 'criadoEm'> = {
  nome: '',
  tipo: 'fisica',
  cpfCnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  uf: 'SP',
  profissaoOuRamo: '',
  estadoCivil: '',
  nacionalidade: 'brasileiro(a)',
  observacoes: '',
}

export default function Clientes() {
  const { clientes, addCliente, updateCliente, removeCliente } = useStore()
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  function set<K extends keyof typeof vazio>(k: K, v: (typeof vazio)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function salvar() {
    if (!form.nome.trim() || !form.cpfCnpj.trim()) return
    if (editandoId) {
      updateCliente(editandoId, form)
      setEditandoId(null)
    } else {
      addCliente(form)
    }
    setForm(vazio)
  }

  function editar(c: Cliente) {
    setEditandoId(c.id)
    setForm({ ...c })
  }

  const filtrados = clientes.filter(
    (c) => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cpfCnpj.includes(busca),
  )

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-serif font-semibold text-brand-900">Clientes</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastro de clientes do escritório.</p>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-medium text-brand-800 mb-4">{editandoId ? 'Editar cliente' : 'Novo cliente'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nome completo / Razão social</label>
            <input className="input" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={form.tipo}
              onChange={(e) => set('tipo', e.target.value as PessoaTipo)}
            >
              <option value="fisica">Pessoa física</option>
              <option value="juridica">Pessoa jurídica</option>
            </select>
          </div>
          <div>
            <label className="label">{form.tipo === 'fisica' ? 'CPF' : 'CNPJ'}</label>
            <input className="input" value={form.cpfCnpj} onChange={(e) => set('cpfCnpj', e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Endereço completo</label>
            <input className="input" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
          </div>
          <div>
            <label className="label">UF</label>
            <select className="input" value={form.uf} onChange={(e) => set('uf', e.target.value)}>
              {UFS.map((u) => (
                <option key={u.sigla} value={u.sigla}>
                  {u.sigla}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{form.tipo === 'fisica' ? 'Profissão' : 'Ramo de atividade'}</label>
            <input
              className="input"
              value={form.profissaoOuRamo}
              onChange={(e) => set('profissaoOuRamo', e.target.value)}
            />
          </div>
          {form.tipo === 'fisica' && (
            <>
              <div>
                <label className="label">Estado civil</label>
                <input
                  className="input"
                  value={form.estadoCivil}
                  onChange={(e) => set('estadoCivil', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Nacionalidade</label>
                <input
                  className="input"
                  value={form.nacionalidade}
                  onChange={(e) => set('nacionalidade', e.target.value)}
                />
              </div>
            </>
          )}
          <div className="md:col-span-3">
            <label className="label">Observações</label>
            <textarea
              className="input"
              rows={2}
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={salvar} className="btn-primary">
            {editandoId ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>
          {editandoId && (
            <button
              onClick={() => {
                setEditandoId(null)
                setForm(vazio)
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-brand-800">Clientes cadastrados ({clientes.length})</h2>
          <input
            className="input max-w-xs"
            placeholder="Buscar por nome ou CPF/CNPJ"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 bg-slate-50">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">CPF/CNPJ</th>
              <th className="px-4 py-2 font-medium">Contato</th>
              <th className="px-4 py-2 font-medium">UF</th>
              <th className="px-4 py-2 font-medium">Cadastro</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-700">{c.nome}</td>
                <td className="px-4 py-2 text-slate-600">{c.cpfCnpj}</td>
                <td className="px-4 py-2 text-slate-600">
                  {c.email} {c.telefone && `· ${c.telefone}`}
                </td>
                <td className="px-4 py-2 text-slate-600">{c.uf}</td>
                <td className="px-4 py-2 text-slate-500">{formatDate(c.criadoEm)}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <button onClick={() => editar(c)} className="text-brand-600 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => removeCliente(c.id)} className="text-red-500 hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
