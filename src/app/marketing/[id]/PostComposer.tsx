"use client";

import { useState } from "react";
import { CalendarClock, Send, Loader2, TrendingUp, Check } from "lucide-react";

interface Props {
  contentId: string;
  defaultCaption: string;
  imagePaths: string[];
  hasInstagram: boolean;
  posts: any[];
  onChanged: () => void;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PostComposer({ contentId, defaultCaption, imagePaths, hasInstagram, posts, onChanged }: Props) {
  const [platform, setPlatform] = useState<"facebook" | "instagram">("facebook");
  const [caption, setCaption] = useState(defaultCaption);
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [boostOpen, setBoostOpen] = useState<string | null>(null);
  const [boostBudget, setBoostBudget] = useState("150");
  const [boostDays, setBoostDays] = useState("7");
  const [boostConfirm, setBoostConfirm] = useState(false);
  const [boostBusy, setBoostBusy] = useState(false);
  const [boostNotice, setBoostNotice] = useState<string | null>(null);

  async function createPost() {
    setBusy(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          platform,
          caption,
          imagePaths,
          scheduledAt: scheduledAt || null,
        }),
      });
      const post = await res.json();
      if (!scheduledAt) {
        await fetch(`/api/social/posts/${post.id}/publish`, { method: "POST" });
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function submitBoost(postId: string) {
    setBoostBusy(true);
    setBoostNotice(null);
    try {
      const res = await fetch(`/api/social/posts/${postId}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetTotalBRL: Number(boostBudget),
          durationDays: Number(boostDays),
          confirmCompliance: boostConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBoostNotice(data.error);
      } else {
        setBoostNotice(data.notice);
        onChanged();
      }
    } finally {
      setBoostBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-navy-50 pt-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <select className="input sm:w-40 text-xs" value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
          <option value="facebook">Facebook</option>
          <option value="instagram" disabled={!hasInstagram}>
            Instagram {!hasInstagram && "(sem imagem)"}
          </option>
        </select>
        <input type="datetime-local" className="input sm:w-56 text-xs" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <button className="btn-secondary text-xs" onClick={createPost} disabled={busy || !caption}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : scheduledAt ? <CalendarClock size={14} /> : <Send size={14} />}
          {scheduledAt ? "Agendar" : "Publicar agora"}
        </button>
      </div>
      <textarea className="input mt-2 text-xs" rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} />

      {posts.length > 0 && (
        <div className="mt-3 space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="rounded-lg bg-navy-50 px-3 py-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium text-navy-700 capitalize">{p.platform}</span>
                <span
                  className={`badge ${
                    p.status === "publicado"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : p.status === "agendado"
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : p.status === "falhou"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-navy-100 text-navy-600 border-navy-200"
                  }`}
                >
                  {p.status}
                </span>
                {p.scheduledAt && p.status === "agendado" && <span className="text-navy-400">para {new Date(p.scheduledAt).toLocaleString("pt-BR")}</span>}
                {p.errorMessage && <span className="text-red-600">{p.errorMessage}</span>}
              </div>

              {p.status === "publicado" && p.platform === "facebook" && !p.boosted && (
                <button className="btn-ghost text-xs mt-1 !px-0" onClick={() => setBoostOpen(boostOpen === p.id ? null : p.id)}>
                  <TrendingUp size={12} /> Impulsionar
                </button>
              )}
              {p.boosted && (
                <p className="mt-1 text-navy-500 flex items-center gap-1">
                  <Check size={12} /> Impulsionamento criado (R$ {p.boostBudget} / {p.boostDurationDays} dias) — revise e ative no Meta Ads Manager
                </p>
              )}

              {boostOpen === p.id && (
                <div className="mt-2 space-y-2 rounded-lg border border-navy-100 bg-white p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Orçamento total (R$)</label>
                      <input type="number" className="input text-xs" value={boostBudget} onChange={(e) => setBoostBudget(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Duração (dias)</label>
                      <input type="number" className="input text-xs" value={boostDays} onChange={(e) => setBoostDays(e.target.value)} />
                    </div>
                  </div>
                  <label className="flex items-start gap-2 text-[11px] text-navy-500">
                    <input type="checkbox" checked={boostConfirm} onChange={(e) => setBoostConfirm(e.target.checked)} className="mt-0.5" />
                    Confirmo que este conteúdo não contém oferta de serviço, promessa de resultado ou menção a honorários (Provimento 205/2021 da OAB) e
                    autorizo a criação de uma campanha com o orçamento acima.
                  </label>
                  <button className="btn-gold text-xs w-full" disabled={!boostConfirm || boostBusy} onClick={() => submitBoost(p.id)}>
                    {boostBusy ? "Criando campanha..." : "Criar campanha (fica pausada até você ativar)"}
                  </button>
                  {boostNotice && <p className="text-[11px] text-navy-500">{boostNotice}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
