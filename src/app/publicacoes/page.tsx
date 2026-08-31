"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, EmptyState, UrgencyBadge, StatusBadge } from "@/components/ui";
import Modal from "@/components/Modal";
import { Newspaper, Plus, Sparkles, CalendarPlus, Info } from "lucide-react";
import { TRIBUNAIS } from "@/lib/constants";

interface Publication {
  id: string;
  tribunal: string;
  instance: string | null;
  date: string;
  content: string;
  processNumber: string | null;
  status: string;
  suggestedTask: string | null;
  suggestedDeadlineDays: number | null;
  urgency: string | null;
  urgencyReason: string | null;
  matchedLawyer: { id: string; name: string } | null;
  process: { id: string; client: { name: string } } | null;
}

export default function PublicacoesPage() {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [status, setStatus] = useState("");
  const [openImport, setOpenImport] = useState(false);
  const [selected, setSelected] = useState<Publication | null>(null);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [importForm, setImportForm] = useState({ tribunal: TRIBUNAIS[0], instance: "1ª instância", content: "", processNumber: "" });
  const [editForm, setEditForm] = useState({ suggestedTask: "", suggestedDeadlineDays: 5, urgency: "media", assignedToId: "" });
  const [saving, setSaving] = useState(false);

  function load(s = status) {
    fetch(`/api/publicacoes${s ? `?status=${s}` : ""}`)
      .then((r) => r.json())
      .then(setPubs);
  }

  useEffect(() => load(), []); // eslint-disable-line
  useEffect(() => {
    fetch("/api/advogados").then((r) => r.json()).then(setLawyers);
  }, []);

  function openDetail(p: Publication) {
    setSelected(p);
    setEditForm({
      suggestedTask: p.suggestedTask || "",
      suggestedDeadlineDays: p.suggestedDeadlineDays ?? 5,
      urgency: p.urgency || "media",
      assignedToId: "",
    });
  }

  async function submitImport() {
    setSaving(true);
    try {
      await fetch("/api/publicacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importForm),
      });
      setOpenImport(false);
      setImportForm({ ...importForm, content: "", processNumber: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function sendToAgenda() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/publicacoes/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, createTask: true }),
      });
      setSelected(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Publicações"
        subtitle="Publicações dos diários eletrônicos que citam advogados cadastrados no escritório"
        actions={
          <button className="btn-gold" onClick={() => setOpenImport(true)}>
            <Plus size={16} /> Importar publicação
          </button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-navy-100 bg-white px-4 py-3 text-xs text-navy-500">
        <Info size={14} className="mt-0.5 shrink-0 text-gold-500" />
        A busca automática diária (08h) já está pronta no código, com dois provedores: o <strong>DJEN</strong> — API oficial e gratuita
        do CNJ, mas que bloqueia acesso de fora do Brasil, exigindo um proxy brasileiro em{" "}
        <code className="mx-1 rounded bg-navy-50 px-1">DJEN_PROXY_URL</code> — e o <strong>Escavador</strong>, provedor pago, que exige{" "}
        <code className="mx-1 rounded bg-navy-50 px-1">ESCAVADOR_API_TOKEN</code> (ver README). Enquanto nenhum dos dois estiver
        configurado, use "Importar publicação" para lançar manualmente o conteúdo do diário.
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {["", "novo", "analisado", "prazo_definido", "concluido"].map((s) => (
          <button
            key={s}
            className={`badge cursor-pointer ${status === s ? "bg-navy-800 text-white border-navy-800" : "border-navy-200 text-navy-500 bg-white"}`}
            onClick={() => {
              setStatus(s);
              load(s);
            }}
          >
            {s || "Todas"}
          </button>
        ))}
      </div>

      {pubs.length === 0 && (
        <Card>
          <EmptyState title="Nenhuma publicação" description="Publicações importadas aparecerão aqui para análise e definição de prazos." />
        </Card>
      )}

      <div className="space-y-3">
        {pubs.map((p) => (
          <Card key={p.id} className="p-4 cursor-pointer hover:border-gold-300 transition-colors" onClick={() => openDetail(p)}>
            <div className="flex items-start gap-3">
              <Newspaper className="text-navy-400 shrink-0 mt-0.5" size={20} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-navy-900">
                    {p.tribunal} {p.instance ? `· ${p.instance}` : ""}
                  </p>
                  <StatusBadge status={p.status} />
                  <UrgencyBadge urgency={p.urgency} />
                </div>
                <p className="text-xs text-navy-400 mt-1">
                  {new Date(p.date).toLocaleDateString("pt-BR")}
                  {p.matchedLawyer ? ` · ${p.matchedLawyer.name}` : " · advogado não identificado"}
                  {p.process ? ` · ${p.process.client.name}` : ""}
                </p>
                <p className="text-sm text-navy-600 mt-2 line-clamp-2">{p.content}</p>
                {p.suggestedTask && (
                  <p className="text-xs text-gold-700 mt-2 flex items-center gap-1">
                    <Sparkles size={12} /> {p.suggestedTask}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={openImport} onClose={() => setOpenImport(false)} title="Importar publicação manualmente">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tribunal</label>
              <select className="input" value={importForm.tribunal} onChange={(e) => setImportForm({ ...importForm, tribunal: e.target.value })}>
                {TRIBUNAIS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Instância</label>
              <input className="input" value={importForm.instance} onChange={(e) => setImportForm({ ...importForm, instance: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Número do processo (opcional)</label>
            <input className="input" value={importForm.processNumber} onChange={(e) => setImportForm({ ...importForm, processNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Conteúdo da publicação</label>
            <textarea
              className="input"
              rows={6}
              value={importForm.content}
              onChange={(e) => setImportForm({ ...importForm, content: e.target.value })}
              placeholder="Cole aqui o texto da publicação do diário oficial..."
            />
          </div>
          <button className="btn-gold w-full" onClick={submitImport} disabled={!importForm.content || saving}>
            {saving ? "Analisando com IA..." : "Importar e analisar"}
          </button>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhe da publicação" wide>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-navy-50 p-4 text-sm text-navy-700 whitespace-pre-wrap">{selected.content}</div>
            {selected.urgencyReason && (
              <div className="flex items-start gap-2 text-xs text-navy-500">
                <Sparkles size={14} className="text-gold-500 mt-0.5 shrink-0" />
                <span>{selected.urgencyReason}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tarefa sugerida</label>
                <input className="input" value={editForm.suggestedTask} onChange={(e) => setEditForm({ ...editForm, suggestedTask: e.target.value })} />
              </div>
              <div>
                <label className="label">Prazo (dias)</label>
                <input
                  type="number"
                  className="input"
                  value={editForm.suggestedDeadlineDays}
                  onChange={(e) => setEditForm({ ...editForm, suggestedDeadlineDays: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Urgência</label>
                <select className="input" value={editForm.urgency} onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div>
                <label className="label">Atribuir a</label>
                <select className="input" value={editForm.assignedToId} onChange={(e) => setEditForm({ ...editForm, assignedToId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn-gold w-full" onClick={sendToAgenda} disabled={saving}>
              <CalendarPlus size={16} /> Definir prazo e enviar para Agenda
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
