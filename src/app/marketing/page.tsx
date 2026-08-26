"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import Modal from "@/components/Modal";
import { Plus, Megaphone } from "lucide-react";
import { PROCESS_AREAS, AREA_LABEL } from "@/lib/constants";

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", area: "civel", goal: "", startDate: new Date().toISOString().slice(0, 10), endDate: "", budget: "" });

  function load() {
    fetch("/api/marketing/campanhas").then((r) => r.json()).then(setCampaigns);
  }
  useEffect(load, []);

  async function save() {
    await fetch("/api/marketing/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ ...form, name: "", goal: "", budget: "" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Marketing"
        subtitle="Campanhas por área do direito, geração de conteúdo com IA e acompanhamento de resultados"
        actions={
          <button className="btn-gold" onClick={() => setOpen(true)}>
            <Plus size={16} /> Nova campanha
          </button>
        }
      />

      {campaigns.length === 0 && (
        <Card>
          <EmptyState title="Nenhuma campanha" description="Crie uma campanha para gerar conteúdo com IA e acompanhar novos processos e reuniões." />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <Link href={`/marketing/${c.id}`} key={c.id}>
            <Card className="p-5 h-full hover:border-gold-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600">
                  <Megaphone size={18} />
                </div>
                <div>
                  <p className="font-medium text-navy-900">{c.name}</p>
                  <p className="text-xs text-navy-400">{AREA_LABEL[c.area] ?? c.area}</p>
                </div>
              </div>
              <p className="text-xs text-navy-400 mt-3">{c._count.contents} conteúdo(s) gerado(s)</p>
              <span className="badge bg-navy-50 border-navy-100 text-navy-500 mt-2">{c.status}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova campanha de marketing">
        <div className="space-y-3">
          <div>
            <label className="label">Nome da campanha</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Área do direito</label>
              <select className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {PROCESS_AREAS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Orçamento (R$)</label>
              <input type="number" className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Início</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Fim (opcional)</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Objetivo</label>
            <textarea className="input" rows={2} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
          </div>
          <button className="btn-gold w-full" onClick={save} disabled={!form.name}>
            Criar campanha
          </button>
        </div>
      </Modal>
    </div>
  );
}
