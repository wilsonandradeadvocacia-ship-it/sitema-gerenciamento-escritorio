"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, Kpi } from "@/components/ui";
import { ArrowLeft, Sparkles, Loader2, Link2 } from "lucide-react";
import { AREA_LABEL } from "@/lib/constants";
import MarketingContentCard from "./MarketingContentCard";

const CONTENT_TYPES = [
  { value: "instagram_carousel", label: "Carrossel Instagram" },
  { value: "instagram_post", label: "Post único Instagram" },
  { value: "instagram_reels", label: "Roteiro Reels" },
  { value: "facebook_post", label: "Post Facebook" },
  { value: "artigo", label: "Artigo de blog" },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [type, setType] = useState("instagram_carousel");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [meta, setMeta] = useState<{ configured: boolean; connected: boolean; pageName: string | null; hasInstagram: boolean } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);

  function load() {
    fetch(`/api/marketing/campanhas/${id}`).then((r) => r.json()).then(setCampaign);
    fetch("/api/social/posts").then((r) => r.json()).then(setPosts);
  }
  useEffect(load, [id]);
  useEffect(() => {
    fetch("/api/integrations/meta/status").then((r) => r.json()).then(setMeta);
  }, []);

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
      <PageHeader
        title={campaign.name}
        subtitle={`${AREA_LABEL[campaign.area] ?? campaign.area} · desde ${new Date(campaign.startDate).toLocaleDateString("pt-BR")}`}
        actions={
          meta &&
          (meta.connected ? (
            <span className="badge bg-emerald-100 text-emerald-800 border-emerald-200">
              <Link2 size={12} className="mr-1" /> {meta.pageName} conectado
            </span>
          ) : (
            <a
              href="/api/integrations/meta/auth"
              className="btn-secondary text-xs py-1.5"
              title={meta.configured ? "Conectar Facebook/Instagram" : "Configure META_APP_ID/SECRET no .env"}
            >
              <Link2 size={14} /> {meta.configured ? "Conectar Facebook/Instagram" : "Meta (não configurado)"}
            </a>
          ))
        }
      />

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
            placeholder="Tema ou objetivo (ex: aviso prévio proporcional, cláusula abusiva em contrato de adesão...)"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <button className="btn-gold" onClick={generate} disabled={!brief || generating}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Gerar
          </button>
        </div>
        <p className="text-xs text-navy-400">
          Conteúdo estruturado (situação → base normativa → nuance → fechamento informativo) conforme o Provimento 205/2021 da OAB, com imagens geradas
          automaticamente para Instagram/Facebook.
        </p>
      </Card>

      <div className="space-y-4">
        {campaign.contents.map((c: any) => (
          <MarketingContentCard key={c.id} content={c} allPosts={posts} hasInstagram={!!meta?.hasInstagram} onChanged={load} />
        ))}
        {campaign.contents.length === 0 && <p className="text-sm text-navy-400">Nenhum conteúdo gerado ainda.</p>}
      </div>
    </div>
  );
}
