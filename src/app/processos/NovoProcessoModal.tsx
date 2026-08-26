"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { PROCESS_AREAS } from "@/lib/constants";

export default function NovoProcessoModal({
  open,
  onClose,
  onCreated,
  defaultClientId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  defaultClientId?: string;
}) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    clientId: defaultClientId || "",
    area: "civel",
    number: "",
    court: "",
    instance: "1ª instância",
    subject: "",
    phase: "",
    responsibleId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/clientes").then((r) => r.json()).then((d) => setClients(d));
      fetch("/api/advogados").then((r) => r.json()).then((d) => setLawyers(d));
      setForm((f) => ({ ...f, clientId: defaultClientId || f.clientId }));
    }
  }, [open, defaultClientId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      onClose();
      onCreated(data.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Processo">
      <div className="space-y-3">
        <div>
          <label className="label">Cliente</label>
          <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">Selecione...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Área</label>
            <select className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
              {PROCESS_AREAS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Número (CNJ)</label>
            <input className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vara/Tribunal</label>
            <input className="input" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} />
          </div>
          <div>
            <label className="label">Instância</label>
            <input className="input" value={form.instance} onChange={(e) => setForm({ ...form, instance: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Assunto</label>
          <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label className="label">Fase atual</label>
          <input className="input" value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} placeholder="Ex: Aguardando contestação" />
        </div>
        <div>
          <label className="label">Advogado responsável</label>
          <select className="input" value={form.responsibleId} onChange={(e) => setForm({ ...form, responsibleId: e.target.value })}>
            <option value="">Selecione...</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-gold w-full mt-2" onClick={save} disabled={!form.clientId || saving}>
          {saving ? "Salvando..." : "Cadastrar processo"}
        </button>
      </div>
    </Modal>
  );
}
