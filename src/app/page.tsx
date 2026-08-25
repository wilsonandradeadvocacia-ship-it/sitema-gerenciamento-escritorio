"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Kpi, PageHeader, UrgencyBadge } from "@/components/ui";
import { AREA_LABEL, EVENT_TYPES } from "@/lib/constants";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Gavel, Users, Newspaper, Wallet, CalendarDays, Sparkles } from "lucide-react";

const COLORS = ["#b8935c", "#8a6a3d", "#dbbd85", "#1f3358", "#4e6b9e", "#7a90b6", "#a7b5cf", "#634b2e", "#cca86a", "#141c2e", "#0c121e"];

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-navy-400 text-sm">Carregando painel...</p>;

  const pieData = data.processesByArea.map((p: any) => ({ name: AREA_LABEL[p.area] ?? p.area, value: p.count }));

  return (
    <div>
      <PageHeader title="Visão Geral" subtitle="Panorama do escritório Wilson Andrade Advocacia e Consultoria Jurídica" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Processos ativos" value={data.activeProcesses} />
        <Kpi label="Clientes" value={data.clients} />
        <Kpi label="Publicações pendentes" value={data.pendingPublications} />
        <Kpi
          label="Saldo (30 dias)"
          value={<span className={data.finance.saldo30 >= 0 ? "text-emerald-700" : "text-red-600"}>{fmtBRL(data.finance.saldo30)}</span>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-display text-base text-navy-900 mb-3 flex items-center gap-2">
            <Gavel size={16} className="text-gold-500" /> Processos por área
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                  {pieData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-navy-400">Nenhum processo cadastrado ainda.</p>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base text-navy-900 flex items-center gap-2">
              <CalendarDays size={16} className="text-gold-500" /> Próximos 14 dias
            </h3>
            <Link href="/agenda" className="text-xs text-gold-600 hover:underline">
              Ver agenda completa
            </Link>
          </div>
          <div className="space-y-2">
            {data.upcomingEvents.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b border-navy-50 pb-2">
                <div>
                  <p className="text-navy-800">{e.title}</p>
                  <p className="text-xs text-navy-400">
                    {new Date(e.date).toLocaleDateString("pt-BR")} · {EVENT_TYPES.find((t) => t.value === e.type)?.label}
                    {e.client ? ` · ${e.client.name}` : ""}
                  </p>
                </div>
                <UrgencyBadge urgency={e.urgency} />
              </div>
            ))}
            {data.upcomingEvents.length === 0 && <p className="text-xs text-navy-400">Nenhum compromisso nos próximos 14 dias.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base text-navy-900 flex items-center gap-2">
              <Newspaper size={16} className="text-gold-500" /> Publicações recentes
            </h3>
            <Link href="/publicacoes" className="text-xs text-gold-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentPublications.map((p: any) => (
              <div key={p.id} className="text-sm border-b border-navy-50 pb-2">
                <p className="text-navy-800">
                  {p.tribunal} {p.matchedLawyer ? `· ${p.matchedLawyer.name}` : ""}
                </p>
                <p className="text-xs text-navy-400 flex items-center gap-1">
                  <Sparkles size={11} className="text-gold-500" /> {p.suggestedTask}
                </p>
              </div>
            ))}
            {data.recentPublications.length === 0 && <p className="text-xs text-navy-400">Nenhuma publicação ainda.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base text-navy-900 mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-gold-500" /> Financeiro (30 dias)
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-navy-400">Receitas</span>
              <span className="font-medium text-emerald-700">{fmtBRL(data.finance.receitas30)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-400">Despesas</span>
              <span className="font-medium text-red-600">{fmtBRL(data.finance.despesas30)}</span>
            </div>
            <Link href="/financeiro" className="text-xs text-gold-600 hover:underline block pt-2">
              Ver análise financeira completa
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
