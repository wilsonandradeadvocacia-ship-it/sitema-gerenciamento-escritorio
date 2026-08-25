"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { ArrowLeft, Upload, FileText, Trash2, Gavel, Plus, ScrollText, Wallet, CheckCircle2, Circle, Download } from "lucide-react";
import { AREA_LABEL, CLIENT_DOC_TYPES } from "@/lib/constants";
import GerarProcuracaoModal from "./GerarProcuracaoModal";
import GerarContratoModal from "./GerarContratoModal";
import NovoProcessoModal from "@/app/processos/NovoProcessoModal";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [openProcuracao, setOpenProcuracao] = useState(false);
  const [openContrato, setOpenContrato] = useState(false);
  const [openProcesso, setOpenProcesso] = useState(false);
  const [docType, setDocType] = useState(CLIENT_DOC_TYPES[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch(`/api/clientes/${id}`).then((r) => r.json()).then(setClient);
  }
  useEffect(load, [id]);

  async function uploadDoc(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("type", docType);
    await fetch(`/api/clientes/${id}/documentos`, { method: "POST", body: form });
    load();
  }

  async function removeDoc(docId: string) {
    if (!confirm("Remover documento?")) return;
    await fetch(`/api/clientes/${id}/documentos/${docId}`, { method: "DELETE" });
    load();
  }

  async function toggleSigned(contractId: string, signed: boolean) {
    await fetch(`/api/contratos/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signed }),
    });
    load();
  }

  async function togglePaid(contractId: string, installmentId: string, paid: boolean) {
    await fetch(`/api/contratos/${contractId}/parcelas/${installmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid }),
    });
    load();
  }

  if (!client) return <p className="text-navy-400 text-sm">Carregando...</p>;

  return (
    <div className="max-w-5xl">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 mb-3">
        <ArrowLeft size={14} /> Voltar para Clientes
      </Link>
      <PageHeader
        title={client.name}
        subtitle={`${client.kind === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"} · ${client.cpfCnpj || "sem documento"}`}
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setOpenProcuracao(true)}>
              <ScrollText size={16} /> Procuração
            </button>
            <button className="btn-gold" onClick={() => setOpenContrato(true)}>
              <FileText size={16} /> Contrato de Honorários
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-display text-base text-navy-900 mb-3">Qualificação</h3>
            <dl className="space-y-2 text-sm">
              {client.rg && (
                <div className="flex justify-between">
                  <dt className="text-navy-400">RG</dt>
                  <dd>{client.rg}</dd>
                </div>
              )}
              {client.maritalStatus && (
                <div className="flex justify-between">
                  <dt className="text-navy-400">Estado civil</dt>
                  <dd>{client.maritalStatus}</dd>
                </div>
              )}
              {client.profession && (
                <div className="flex justify-between">
                  <dt className="text-navy-400">Profissão</dt>
                  <dd>{client.profession}</dd>
                </div>
              )}
              {client.phone && (
                <div className="flex justify-between">
                  <dt className="text-navy-400">Telefone</dt>
                  <dd>{client.phone}</dd>
                </div>
              )}
              {client.email && (
                <div className="flex justify-between">
                  <dt className="text-navy-400">E-mail</dt>
                  <dd className="truncate max-w-[160px]">{client.email}</dd>
                </div>
              )}
              {client.address && (
                <div>
                  <dt className="text-navy-400">Endereço</dt>
                  <dd>
                    {client.address}
                    {client.city ? `, ${client.city}/${client.state}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base text-navy-900">Documentos</h3>
            </div>
            <div className="flex gap-2 mb-3">
              <select className="input text-xs" value={docType} onChange={(e) => setDocType(e.target.value)}>
                {CLIENT_DOC_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <button className="btn-secondary text-xs shrink-0" onClick={() => fileRef.current?.click()}>
                <Upload size={14} />
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
            </div>
            <div className="space-y-2">
              {client.documents.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-xs bg-navy-50 rounded-lg px-3 py-2">
                  <a href={d.filePath} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-navy-600 hover:text-gold-700 truncate">
                    <FileText size={12} /> {d.type}
                  </a>
                  <button onClick={() => removeDoc(d.id)} className="text-navy-300 hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {client.documents.length === 0 && <p className="text-xs text-navy-400">Nenhum documento anexado.</p>}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base text-navy-900 flex items-center gap-2">
                <Gavel size={16} className="text-gold-500" /> Processos
              </h3>
              <button className="btn-secondary text-xs py-1.5" onClick={() => setOpenProcesso(true)}>
                <Plus size={14} /> Novo processo
              </button>
            </div>
            <div className="space-y-2">
              {client.processes.map((p: any) => (
                <Link key={p.id} href={`/processos/${p.id}`} className="block rounded-lg border border-navy-100 p-3 hover:border-gold-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-800">{AREA_LABEL[p.area] ?? p.area}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-navy-400 mt-1">
                    {p.number || "sem número"} {p.movements[0] ? `· ${p.movements[0].description.slice(0, 60)}` : ""}
                  </p>
                </Link>
              ))}
              {client.processes.length === 0 && <p className="text-xs text-navy-400">Nenhum processo cadastrado.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-base text-navy-900 mb-3 flex items-center gap-2">
              <Wallet size={16} className="text-gold-500" /> Contratos de Honorários
            </h3>
            <div className="space-y-4">
              {client.contracts.map((c: any) => (
                <div key={c.id} className="rounded-lg border border-navy-100 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-navy-800">{c.paymentType.toUpperCase()}</p>
                      <p className="text-xs text-navy-400">
                        {c.totalValue ? fmtBRL(c.totalValue) : c.installmentValue ? `${fmtBRL(c.installmentValue)}/mês` : ""}
                        {c.successFeePct ? ` · ${c.successFeePct}% de êxito` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={c.filePath} download className="btn-secondary text-xs py-1">
                        <Download size={12} /> Contrato
                      </a>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <input type="checkbox" checked={c.signed} onChange={(e) => toggleSigned(c.id, e.target.checked)} />
                        {c.signed ? "Assinado" : "Confirmar assinatura"}
                      </label>
                    </div>
                  </div>

                  {c.installmentsList?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {c.installmentsList.map((i: any) => (
                        <div key={i.id} className="flex items-center justify-between text-xs border-t border-navy-50 pt-2">
                          <button
                            className="flex items-center gap-1.5 text-navy-500 disabled:opacity-40"
                            disabled={!c.signed}
                            onClick={() => togglePaid(c.id, i.id, !i.paid)}
                            title={!c.signed ? "Confirme a assinatura do contrato para gerenciar cobranças" : ""}
                          >
                            {i.paid ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Circle size={14} />}
                            Parcela {i.number} · vence {new Date(i.dueDate).toLocaleDateString("pt-BR")}
                          </button>
                          <span className={i.paid ? "text-emerald-700 font-medium" : "text-navy-600"}>{fmtBRL(i.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!c.signed && (
                    <p className="text-[11px] text-amber-600 mt-2">
                      Confirme a assinatura para habilitar a cobrança das parcelas no Financeiro.
                    </p>
                  )}
                </div>
              ))}
              {client.contracts.length === 0 && <p className="text-xs text-navy-400">Nenhum contrato gerado ainda.</p>}
            </div>
          </Card>

          {client.powersOfAtty?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display text-base text-navy-900 mb-3 flex items-center gap-2">
                <ScrollText size={16} className="text-gold-500" /> Procurações
              </h3>
              <div className="space-y-2">
                {client.powersOfAtty.map((p: any) => (
                  <a key={p.id} href={p.filePath} download className="flex items-center justify-between text-xs bg-navy-50 rounded-lg px-3 py-2 hover:bg-navy-100">
                    <span>Procuração · {new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                    <Download size={12} />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <GerarProcuracaoModal
        open={openProcuracao}
        onClose={() => setOpenProcuracao(false)}
        clientId={id}
        processes={client.processes}
        onGenerated={load}
      />
      <GerarContratoModal open={openContrato} onClose={() => setOpenContrato(false)} clientId={id} processes={client.processes} onGenerated={load} />
      <NovoProcessoModal open={openProcesso} onClose={() => setOpenProcesso(false)} onCreated={load} defaultClientId={id} />
    </div>
  );
}
