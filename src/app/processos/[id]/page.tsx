"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, PageHeader, UrgencyBadge, StatusBadge } from "@/components/ui";
import { AREA_LABEL } from "@/lib/constants";
import { Sparkles, Plus, ArrowLeft, CalendarPlus } from "lucide-react";
import Link from "next/link";

export default function ProcessoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [process, setProcess] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [mov, setMov] = useState({ description: "", phase: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/processos/${id}`)
      .then((r) => r.json())
      .then(setProcess);
  }

  useEffect(load, [id]);

  async function addMovement() {
    setSaving(true);
    try {
      await fetch(`/api/processos/${id}/movimentacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mov),
      });
      setMov({ description: "", phase: "" });
      setShowAdd(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function createDeadlineTask() {
    await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: process.suggestedTask,
        type: "tarefa",
        date: new Date().toISOString(),
        urgency: process.suggestedUrgency,
        processId: process.id,
        clientId: process.clientId,
      }),
    });
    router.push("/agenda");
  }

  if (!process) return <p className="text-navy-400 text-sm">Carregando...</p>;

  return (
    <div className="max-w-4xl">
      <Link href="/processos" className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 mb-3">
        <ArrowLeft size={14} /> Voltar para Processos
      </Link>
      <PageHeader
        title={process.client.name}
        subtitle={`${AREA_LABEL[process.area] ?? process.area}${process.number ? ` · ${process.number}` : ""}${process.court ? ` · ${process.court}` : ""}`}
        actions={<StatusBadge status={process.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 bg-navy-800 text-white border-none">
            <div className="flex items-center gap-2 text-gold-300 text-xs font-medium uppercase tracking-wide mb-2">
              <Sparkles size={14} /> Recomendação de tarefa
            </div>
            <p className="font-display text-lg">{process.suggestedTask || "Analisando..."}</p>
            <div className="flex items-center gap-3 mt-3">
              <UrgencyBadge urgency={process.suggestedUrgency} />
              <button onClick={createDeadlineTask} className="btn-gold text-xs py-1.5">
                <CalendarPlus size={14} /> Enviar para Agenda
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-navy-900">Movimentações</h3>
              <button className="btn-secondary text-xs py-1.5" onClick={() => setShowAdd((s) => !s)}>
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {showAdd && (
              <div className="mb-4 space-y-2 rounded-lg border border-navy-100 p-3">
                <input
                  className="input"
                  placeholder="Fase atual (opcional)"
                  value={mov.phase}
                  onChange={(e) => setMov({ ...mov, phase: e.target.value })}
                />
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Descrição da movimentação"
                  value={mov.description}
                  onChange={(e) => setMov({ ...mov, description: e.target.value })}
                />
                <button className="btn-gold text-xs py-1.5" onClick={addMovement} disabled={!mov.description || saving}>
                  {saving ? "Salvando..." : "Registrar movimentação"}
                </button>
              </div>
            )}

            <div className="space-y-4">
              {process.movements.length === 0 && <p className="text-sm text-navy-400">Nenhuma movimentação registrada.</p>}
              {process.movements.map((m: any) => (
                <div key={m.id} className="flex gap-3 border-l-2 border-gold-200 pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gold-500" />
                  <div>
                    <p className="text-xs text-navy-400">{new Date(m.date).toLocaleDateString("pt-BR")}{m.phase ? ` · ${m.phase}` : ""}</p>
                    <p className="text-sm text-navy-700">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-display text-base text-navy-900 mb-3">Detalhes</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-400">Cliente</dt>
                <dd className="text-navy-700">
                  <Link href={`/clientes/${process.clientId}`} className="text-gold-600 hover:underline">
                    {process.client.name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">Área</dt>
                <dd className="text-navy-700">{AREA_LABEL[process.area]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">Instância</dt>
                <dd className="text-navy-700">{process.instance || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">Responsável</dt>
                <dd className="text-navy-700">{process.responsible?.name || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">Assunto</dt>
                <dd className="text-navy-700 text-right">{process.subject || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-400">Fase</dt>
                <dd className="text-navy-700 text-right">{process.phase || "-"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
