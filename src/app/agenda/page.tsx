"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Card, UrgencyBadge } from "@/components/ui";
import Modal from "@/components/Modal";
import { EVENT_TYPES } from "@/lib/constants";
import { Plus, CalendarDays, MapPin, CheckCircle2, Circle, Link2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventRow {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  urgency: string | null;
  location: string | null;
  description: string | null;
  process?: { id: string; area: string; number: string | null } | null;
  client?: { id: string; name: string } | null;
  assignedTo?: { id: string; name: string } | null;
}

const TYPE_COLORS: Record<string, string> = {
  reuniao: "bg-blue-100 text-blue-800 border-blue-200",
  compromisso: "bg-purple-100 text-purple-800 border-purple-200",
  audiencia: "bg-red-100 text-red-800 border-red-200",
  prazo: "bg-amber-100 text-amber-800 border-amber-200",
  tarefa: "bg-navy-100 text-navy-700 border-navy-200",
};

export default function AgendaPage() {
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [open, setOpen] = useState(false);
  const [google, setGoogle] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    type: "compromisso",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    location: "",
    description: "",
    clientId: "",
    assignedToId: "",
  });

  function load() {
    const from = startOfMonth(month).toISOString();
    const to = endOfMonth(month).toISOString();
    fetch(`/api/agenda?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setEvents);
  }

  useEffect(load, [month]);
  useEffect(() => {
    fetch("/api/integrations/google/status").then((r) => r.json()).then(setGoogle);
    fetch("/api/clientes").then((r) => r.json()).then(setClients);
    fetch("/api/advogados").then((r) => r.json()).then(setLawyers);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  async function save() {
    await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date: new Date(form.date).toISOString() }),
    });
    setOpen(false);
    setForm({ ...form, title: "", description: "", location: "" });
    load();
  }

  async function toggleDone(e: EventRow) {
    await fetch(`/api/agenda/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.status === "concluido" ? "pendente" : "concluido" }),
    });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Reuniões, compromissos, audiências, prazos e tarefas do escritório"
        actions={
          <div className="flex items-center gap-2">
            {google && !google.connected && (
              <a
                href="/api/integrations/google/auth"
                className="btn-secondary text-xs py-1.5"
                title={google.configured ? "Conectar Google Calendar" : "Configure GOOGLE_CLIENT_ID/SECRET no .env"}
              >
                <Link2 size={14} /> {google.configured ? "Conectar Google Calendar" : "Google Calendar (não configurado)"}
              </a>
            )}
            {google?.connected && (
              <span className="badge bg-emerald-100 text-emerald-800 border-emerald-200">
                <Link2 size={12} className="mr-1" /> Google Calendar conectado
              </span>
            )}
            <button className="btn-gold" onClick={() => setOpen(true)}>
              <Plus size={16} /> Novo evento
            </button>
          </div>
        }
      />

      <div className="flex items-center justify-between mb-5">
        <button className="btn-ghost" onClick={() => setMonth((m) => subMonths(m, 1))}>
          ← Mês anterior
        </button>
        <p className="font-display text-lg text-navy-900 capitalize">{format(month, "MMMM yyyy", { locale: ptBR })}</p>
        <button className="btn-ghost" onClick={() => setMonth((m) => addMonths(m, 1))}>
          Próximo mês →
        </button>
      </div>

      {grouped.length === 0 && (
        <Card className="p-10 text-center text-navy-400 text-sm">Nenhum evento neste mês.</Card>
      )}

      <div className="space-y-5">
        {grouped.map(([day, items]) => (
          <div key={day}>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400 mb-2">
              {format(new Date(day), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <div className="space-y-2">
              {items.map((e) => (
                <Card key={e.id} className="p-4 flex items-start gap-3">
                  <button onClick={() => toggleDone(e)} className="mt-0.5 text-navy-300 hover:text-emerald-600">
                    {e.status === "concluido" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-medium text-navy-900 ${e.status === "concluido" ? "line-through text-navy-400" : ""}`}>{e.title}</p>
                      <span className={`badge ${TYPE_COLORS[e.type]}`}>{EVENT_TYPES.find((t) => t.value === e.type)?.label}</span>
                      <UrgencyBadge urgency={e.urgency} />
                    </div>
                    <p className="text-xs text-navy-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} /> {format(new Date(e.date), "HH:mm")}
                      </span>
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {e.location}
                        </span>
                      )}
                      {e.client && <span>{e.client.name}</span>}
                      {e.assignedTo && <span>Responsável: {e.assignedTo.name}</span>}
                    </p>
                    {e.description && <p className="text-xs text-navy-500 mt-1">{e.description}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo evento na Agenda">
        <div className="space-y-3">
          <div>
            <label className="label">Título</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data e hora</label>
              <input type="datetime-local" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Local</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cliente</label>
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">-</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Responsável</label>
              <select className="input" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">-</option>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn-gold w-full" onClick={save} disabled={!form.title}>
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
