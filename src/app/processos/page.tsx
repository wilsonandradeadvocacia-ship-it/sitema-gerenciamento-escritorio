"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState, UrgencyBadge } from "@/components/ui";
import { PROCESS_AREAS, AREA_LABEL } from "@/lib/constants";
import { Plus, Gavel } from "lucide-react";
import NovoProcessoModal from "./NovoProcessoModal";

interface ProcessRow {
  id: string;
  number: string | null;
  area: string;
  status: string;
  phase: string | null;
  suggestedUrgency: string | null;
  client: { id: string; name: string };
  responsible: { id: string; name: string } | null;
  movements: { description: string; date: string }[];
}

export default function ProcessosPage() {
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [area, setArea] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  function load(a = area) {
    setLoading(true);
    fetch(`/api/processos${a ? `?area=${a}` : ""}`)
      .then((r) => r.json())
      .then(setProcesses)
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []); // eslint-disable-line

  return (
    <div>
      <PageHeader
        title="Processos"
        subtitle="Filtre por área e acompanhe fase, última movimentação e recomendação de tarefa"
        actions={
          <button className="btn-gold" onClick={() => setOpen(true)}>
            <Plus size={16} /> Novo processo
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`badge cursor-pointer ${!area ? "bg-navy-800 text-white border-navy-800" : "border-navy-200 text-navy-500 bg-white"}`}
          onClick={() => {
            setArea("");
            load("");
          }}
        >
          Todas
        </button>
        {PROCESS_AREAS.map((a) => (
          <button
            key={a.value}
            className={`badge cursor-pointer ${area === a.value ? "bg-navy-800 text-white border-navy-800" : "border-navy-200 text-navy-500 bg-white"}`}
            onClick={() => {
              setArea(a.value);
              load(a.value);
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {!loading && processes.length === 0 && (
        <Card>
          <EmptyState
            title="Nenhum processo encontrado"
            description="Cadastre processos vinculados aos clientes para acompanhar movimentações e prazos."
            action={
              <button className="btn-gold" onClick={() => setOpen(true)}>
                <Plus size={16} /> Cadastrar processo
              </button>
            }
          />
        </Card>
      )}

      <div className="space-y-3">
        {processes.map((p) => (
          <Link href={`/processos/${p.id}`} key={p.id}>
            <Card className="p-4 flex items-center gap-4 hover:border-gold-300 transition-colors">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 shrink-0">
                <Gavel size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-navy-900">{p.client.name}</p>
                  <span className="badge bg-navy-50 border-navy-100 text-navy-500">{AREA_LABEL[p.area] ?? p.area}</span>
                  <UrgencyBadge urgency={p.suggestedUrgency} />
                </div>
                <p className="text-xs text-navy-400 mt-1 truncate">
                  {p.number ? `${p.number} · ` : ""}
                  {p.phase || "Fase não informada"}
                </p>
                {p.movements[0] && (
                  <p className="text-xs text-navy-400 mt-0.5 truncate">Última mov.: {p.movements[0].description}</p>
                )}
              </div>
              {p.responsible && <span className="text-xs text-navy-400 shrink-0">{p.responsible.name}</span>}
            </Card>
          </Link>
        ))}
      </div>

      <NovoProcessoModal open={open} onClose={() => setOpen(false)} onCreated={() => load()} />
    </div>
  );
}
