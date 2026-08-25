"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, Kpi } from "@/components/ui";
import { ArrowLeft, Sparkles, Loader2, ImageIcon } from "lucide-react";
import { AREA_LABEL } from "@/lib/constants";
import ReactMarkdownFallback from "@/components/MarkdownText";

const CONTENT_TYPES = [
  { value: "post", label: "Post" },
  { value: "legenda", label: "Legenda" },
  { value: "artigo", label: "Artigo de blog" },
  { value: "imagem_prompt", label: "Prompt de imagem (IA)" },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [type, setType] = useState("post");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);

  function load() {
    fetch(`/api/marketing/campanhas/${id}`).then((r) => r.json()).then(setCampaign);
  }
  useEffect(load, [id]);

  async function generate() {
    setGenerating(true);
    try {
      await fetch(`/api/marketing/campanhas/${id}/conteudo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, brief }),
      });
      setBrief("");
      load();
    } finally {
      setGenerating(false);
    }
  }

  if (!campaign) return <p className="text-navy-400 text-sm">Carregando...</p>;

  return (
    <div className="max-w-5xl">
      <Link href="/marketing" className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 mb-3">
        <ArrowLeft size={14} /> Voltar para Marketing
      </Link>
      <PageHeader title={campaign.name} subtitle={`${AREA_LABEL[campaign.area] ?? campaign.area} · desde ${new Date(campaign.startDate).toLocaleDateString("pt-BR")}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Novos processos na área" value={campaign.auto.newProcesses} hint="Durante o período da campanha" />
        <Kpi label="Novos clientes" value={campaign.auto.newClients} />
        <Kpi label="Receita associada" value={campaign.auto.estRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
        <Kpi
          label="Probabilidade de retorno"
          value={campaign.auto.conversionProbability != null ? `${Math.round(campaign.auto.conversionProbability * 100)}%` : "—"}
          hint={campaign.budget ? "vs. orçamento investido" : "defina orçamento para calcular"}
        />
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-display text-base text-navy-900 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-gold-500" /> Gerar conteúdo com IA
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <select className="input sm:w-56" value={type} onChange={(e) => setType(e.target.value)}>
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            className="input flex-1"
            placeholder="Tema ou objetivo (ex: prazo para restituição de IR, direitos do consumidor em compras online...)"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <button className="btn-gold" onClick={generate} disabled={!brief || generating}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Gerar
          </button>
        </div>
        <p className="text-xs text-navy-400">O conteúdo segue as diretrizes de publicidade da OAB (Provimento 205/2021): informativo, sem promessa de resultado.</p>
      </Card>

      <div className="space-y-4">
        {campaign.contents.map((c: any) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="badge bg-gold-50 text-gold-700 border-gold-200">{CONTENT_TYPES.find((t) => t.value === c.type)?.label}</span>
              <span className="text-xs text-navy-400">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
            {c.title && <p className="text-sm font-medium text-navy-700 mb-2">{c.title}</p>}
            {c.type === "imagem_prompt" ? (
              <div className="rounded-lg bg-navy-50 p-4 text-sm text-navy-600 flex items-start gap-2">
                <ImageIcon size={16} className="text-navy-400 mt-0.5 shrink-0" />
                <span>{c.content}</span>
              </div>
            ) : (
              <ReactMarkdownFallback text={c.content} />
            )}
          </Card>
        ))}
        {campaign.contents.length === 0 && <p className="text-sm text-navy-400">Nenhum conteúdo gerado ainda.</p>}
      </div>
    </div>
  );
}
