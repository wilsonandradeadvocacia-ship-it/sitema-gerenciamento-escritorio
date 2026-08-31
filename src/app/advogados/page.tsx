"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import Modal from "@/components/Modal";
import { Plus, Mail, Phone, Trash2, UserSquare2 } from "lucide-react";

interface Lawyer {
  id: string;
  name: string;
  oab: string | null;
  role: string;
  email: string | null;
  phone: string | null;
  areas: string | null;
  active: boolean;
}

export default function AdvogadosPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", oab: "", role: "advogado", email: "", phone: "", areas: "" });

  function load() {
    setLoading(true);
    fetch("/api/advogados")
      .then((r) => r.json())
      .then(setLawyers)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function save() {
    await fetch("/api/advogados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ name: "", oab: "", role: "advogado", email: "", phone: "", areas: "" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover este advogado/colaborador?")) return;
    await fetch(`/api/advogados/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Advogados e Colaboradores"
        subtitle="Cadastro usado na atribuição de tarefas na Agenda"
        actions={
          <button className="btn-gold" onClick={() => setOpen(true)}>
            <Plus size={16} /> Novo cadastro
          </button>
        }
      />

      {!loading && lawyers.length === 0 && (
        <Card>
          <EmptyState
            title="Nenhum advogado cadastrado"
            description="Cadastre os advogados e colaboradores do escritório para vincular processos e tarefas da agenda."
            action={
              <button className="btn-gold" onClick={() => setOpen(true)}>
                <Plus size={16} /> Cadastrar primeiro advogado
              </button>
            }
          />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lawyers.map((l) => (
          <Card key={l.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600">
                  <UserSquare2 size={20} />
                </div>
                <div>
                  <p className="font-medium text-navy-900">{l.name}</p>
                  <p className="text-xs text-navy-400">{l.oab || "sem OAB"} · {l.role}</p>
                </div>
              </div>
              <button onClick={() => remove(l.id)} className="text-navy-300 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-navy-500">
              {l.email && (
                <p className="flex items-center gap-1.5">
                  <Mail size={12} /> {l.email}
                </p>
              )}
              {l.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={12} /> {l.phone}
                </p>
              )}
              {l.areas && <p className="mt-2 text-navy-400">Áreas: {l.areas}</p>}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo advogado/colaborador">
        <div className="space-y-3">
          <div>
            <label className="label">Nome completo</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">OAB</label>
              <input className="input" value={form.oab} onChange={(e) => setForm({ ...form, oab: e.target.value })} placeholder="OAB/AL 00000" />
            </div>
            <div>
              <label className="label">Função</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="advogado">Advogado(a)</option>
                <option value="colaborador">Colaborador(a)</option>
                <option value="estagiario">Estagiário(a)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">E-mail</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Áreas de atuação</label>
            <input className="input" value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} placeholder="Cível, Tributário..." />
          </div>
          <button className="btn-gold w-full mt-2" onClick={save} disabled={!form.name}>
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
