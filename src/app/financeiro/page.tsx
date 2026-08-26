"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Kpi } from "@/components/ui";
import Modal from "@/components/Modal";
import { Plus, Landmark, Upload, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [openAccount, setOpenAccount] = useState(false);
  const [openTx, setOpenTx] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [accountForm, setAccountForm] = useState({ bank: "", agency: "", accountNumber: "", type: "corrente", initialBalance: "0" });
  const [txForm, setTxForm] = useState({ accountId: "", type: "despesa", description: "", amount: "", category: "", clientId: "", date: new Date().toISOString().slice(0, 10) });
  const [importForm, setImportForm] = useState<{ accountId: string; file: File | null }>({ accountId: "", file: null });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  function loadAll() {
    fetch("/api/financeiro/contas").then((r) => r.json()).then((d) => {
      setAccounts(d);
      setTxForm((f) => ({ ...f, accountId: f.accountId || d[0]?.id || "" }));
      setImportForm((f) => ({ ...f, accountId: f.accountId || d[0]?.id || "" }));
    });
    fetch("/api/financeiro/transacoes").then((r) => r.json()).then(setTransactions);
    fetch("/api/financeiro/analise").then((r) => r.json()).then(setAnalysis);
    fetch("/api/clientes").then((r) => r.json()).then(setClients);
  }

  useEffect(loadAll, []);

  async function saveAccount() {
    await fetch("/api/financeiro/contas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountForm),
    });
    setOpenAccount(false);
    setAccountForm({ bank: "", agency: "", accountNumber: "", type: "corrente", initialBalance: "0" });
    loadAll();
  }

  async function saveTx() {
    await fetch("/api/financeiro/transacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txForm),
    });
    setOpenTx(false);
    setTxForm({ ...txForm, description: "", amount: "", category: "" });
    loadAll();
  }

  async function submitImport() {
    if (!importForm.file || !importForm.accountId) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", importForm.file);
      form.append("accountId", importForm.accountId);
      const res = await fetch("/api/financeiro/extrato", { method: "POST", body: form });
      const data = await res.json();
      setImportResult(data.summary);
      loadAll();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Contas, receitas e despesas, extratos bancários e projeção financeira"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setOpenAccount(true)}>
              <Landmark size={16} /> Nova conta
            </button>
            <button className="btn-gold" onClick={() => setOpenTx(true)}>
              <Plus size={16} /> Lançamento
            </button>
          </div>
        }
      />

      {analysis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi label="Receitas (12 meses)" value={fmtBRL(analysis.totals.receitas)} />
          <Kpi label="Despesas (12 meses)" value={fmtBRL(analysis.totals.despesas)} />
          <Kpi
            label="Saldo"
            value={<span className={analysis.totals.saldo >= 0 ? "text-emerald-700" : "text-red-600"}>{fmtBRL(analysis.totals.saldo)}</span>}
          />
          <Kpi label="Receita mensal recorrente" value={fmtBRL(analysis.recurringMonthly)} hint="Contratos assinados (mensal)" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-5">
          <h3 className="font-display text-base text-navy-900 mb-4">Fluxo mensal (12 meses)</h3>
          {analysis && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analysis.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Legend />
                <Area type="monotone" dataKey="receitas" stroke="#b8935c" fill="#f3e9d6" name="Receitas" />
                <Area type="monotone" dataKey="despesas" stroke="#1f3358" fill="#d3dae7" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base text-navy-900 mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-gold-500" /> Projeção (próximos 3 meses)
          </h3>
          <p className="text-xs text-navy-400 mb-4">Baseada na média/tendência dos últimos 6 meses e nos contratos mensais ativos</p>
          {analysis && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analysis.projection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Legend />
                <Bar dataKey="receitasProjetadas" fill="#b8935c" name="Receitas proj." />
                <Bar dataKey="despesasProjetadas" fill="#7a90b6" name="Despesas proj." />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base text-navy-900">Contas</h3>
          </div>
          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="rounded-lg border border-navy-100 p-3">
                <p className="text-sm font-medium text-navy-800">{a.bank}</p>
                <p className="text-xs text-navy-400">
                  {a.type} · Ag {a.agency || "-"} · CC {a.accountNumber || "-"}
                </p>
                <p className="text-xs text-navy-400">{a._count?.transactions ?? 0} lançamento(s)</p>
                <button
                  className="btn-secondary text-xs py-1 mt-2 w-full"
                  onClick={() => {
                    setImportForm({ accountId: a.id, file: null });
                    setOpenImport(true);
                  }}
                >
                  <Upload size={12} /> Importar extrato
                </button>
              </div>
            ))}
            {accounts.length === 0 && <p className="text-xs text-navy-400">Cadastre uma conta bancária.</p>}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-display text-base text-navy-900 mb-3">Últimos lançamentos</h3>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-navy-400 border-b border-navy-100">
                  <th className="py-2 font-medium">Data</th>
                  <th className="font-medium">Descrição</th>
                  <th className="font-medium">Categoria</th>
                  <th className="font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-navy-50">
                    <td className="py-2 text-navy-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                    <td className="text-navy-700 max-w-[200px] truncate">{t.description}</td>
                    <td className="text-navy-400">{t.category || "-"}</td>
                    <td className={`text-right font-medium ${t.amount >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {t.amount >= 0 ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                      {fmtBRL(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && <p className="text-xs text-navy-400 py-4">Nenhum lançamento ainda.</p>}
          </div>
        </Card>
      </div>

      {analysis?.pendingInstallments?.length > 0 && (
        <Card className="p-5 mt-5">
          <h3 className="font-display text-base text-navy-900 mb-3">Parcelas de honorários pendentes</h3>
          <div className="space-y-2">
            {analysis.pendingInstallments.map((i: any) => (
              <div key={i.id} className="flex justify-between text-sm border-b border-navy-50 pb-2">
                <span className="text-navy-600">
                  {i.contract.client.name} · parcela {i.number}
                </span>
                <span className="text-navy-500">{new Date(i.dueDate).toLocaleDateString("pt-BR")}</span>
                <span className="font-medium">{fmtBRL(i.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={openAccount} onClose={() => setOpenAccount(false)} title="Nova conta bancária">
        <div className="space-y-3">
          <div>
            <label className="label">Banco / Instituição</label>
            <input className="input" value={accountForm.bank} onChange={(e) => setAccountForm({ ...accountForm, bank: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Agência</label>
              <input className="input" value={accountForm.agency} onChange={(e) => setAccountForm({ ...accountForm, agency: e.target.value })} />
            </div>
            <div>
              <label className="label">Conta</label>
              <input className="input" value={accountForm.accountNumber} onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}>
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="investimento">Investimento</option>
              <option value="caixa">Caixa</option>
            </select>
          </div>
          <button className="btn-gold w-full" onClick={saveAccount} disabled={!accountForm.bank}>
            Salvar
          </button>
        </div>
      </Modal>

      <Modal open={openTx} onClose={() => setOpenTx(false)} title="Novo lançamento">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div>
              <label className="label">Conta</label>
              <select className="input" value={txForm.accountId} onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bank}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" className="input" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <input className="input" value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} placeholder="Ex: Aluguel, Honorários..." />
            </div>
            <div>
              <label className="label">Cliente (opcional)</label>
              <select className="input" value={txForm.clientId} onChange={(e) => setTxForm({ ...txForm, clientId: e.target.value })}>
                <option value="">-</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn-gold w-full" onClick={saveTx} disabled={!txForm.description || !txForm.amount || !txForm.accountId}>
            Salvar lançamento
          </button>
        </div>
      </Modal>

      <Modal open={openImport} onClose={() => setOpenImport(false)} title="Importar extrato bancário">
        <div className="space-y-3">
          <div>
            <label className="label">Conta</label>
            <select className="input" value={importForm.accountId} onChange={(e) => setImportForm({ ...importForm, accountId: e.target.value })}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bank}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Arquivo (CSV, OFX/QFX, PDF ou TXT)</label>
            <input type="file" accept=".csv,.ofx,.qfx,.pdf,.txt" onChange={(e) => setImportForm({ ...importForm, file: e.target.files?.[0] || null })} />
          </div>
          <button className="btn-gold w-full" onClick={submitImport} disabled={!importForm.file || importing}>
            {importing ? "Analisando extrato..." : "Importar e analisar"}
          </button>
          {importResult && <p className="text-xs text-navy-500 bg-navy-50 rounded-lg p-3">{importResult}</p>}
        </div>
      </Modal>
    </div>
  );
}
