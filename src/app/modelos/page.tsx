"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import Modal from "@/components/Modal";
import { Plus, FileStack, Sparkles, Download, Info } from "lucide-react";
import { TEMPLATE_CATEGORIES, TEMPLATE_PLACEHOLDERS } from "@/lib/constants";

export default function ModelosPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [openGenerate, setOpenGenerate] = useState<any>(null);
  const [openHelp, setOpenHelp] = useState(false);
  const [uploadForm, setUploadForm] = useState<{ name: string; category: string; file: File | null }>({ name: "", category: "peca", file: null });
  const [genClientId, setGenClientId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ docxPath: string; pdfPath: string | null } | null>(null);

  function load() {
    fetch("/api/modelos").then((r) => r.json()).then(setTemplates);
    fetch("/api/clientes").then((r) => r.json()).then(setClients);
  }
  useEffect(load, []);

  async function upload() {
    if (!uploadForm.file) return;
    const form = new FormData();
    form.append("file", uploadForm.file);
    form.append("name", uploadForm.name);
    form.append("category", uploadForm.category);
    await fetch("/api/modelos", { method: "POST", body: form });
    setOpenUpload(false);
    setUploadForm({ name: "", category: "peca", file: null });
    load();
  }

  async function generate() {
    if (!openGenerate) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`/api/modelos/${openGenerate.id}/gerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: genClientId || undefined }),
      });
      const data = await res.json();
      setResult({ docxPath: data.docxPath, pdfPath: data.pdfPath });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Meus Modelos"
        subtitle="Peças, contratos, procurações e notificações prontos para gerar documentos personalizados"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setOpenHelp(true)}>
              <Info size={16} /> Como usar variáveis
            </button>
            <button className="btn-gold" onClick={() => setOpenUpload(true)}>
              <Plus size={16} /> Novo modelo
            </button>
          </div>
        }
      />

      {templates.length === 0 && (
        <Card>
          <EmptyState title="Nenhum modelo cadastrado" description="Envie modelos em .docx com variáveis como {{cliente_nome}} para gerar documentos automaticamente." />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600">
                <FileStack size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-navy-900 truncate">{t.name}</p>
                <p className="text-xs text-navy-400">{TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}</p>
              </div>
            </div>
            <button
              className="btn-gold text-xs py-1.5 w-full mt-4"
              onClick={() => {
                setOpenGenerate(t);
                setGenClientId("");
                setResult(null);
              }}
            >
              <Sparkles size={14} /> Gerar para cliente
            </button>
          </Card>
        ))}
      </div>

      <Modal open={openUpload} onClose={() => setOpenUpload(false)} title="Novo modelo">
        <div className="space-y-3">
          <div>
            <label className="label">Nome do modelo</label>
            <input className="input" value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}>
              {TEMPLATE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Arquivo (.docx)</label>
            <input type="file" accept=".docx" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />
          </div>
          <button className="btn-gold w-full" onClick={upload} disabled={!uploadForm.name || !uploadForm.file}>
            Salvar modelo
          </button>
        </div>
      </Modal>

      <Modal open={!!openGenerate} onClose={() => setOpenGenerate(null)} title={`Gerar: ${openGenerate?.name ?? ""}`}>
        <div className="space-y-3">
          <div>
            <label className="label">Cliente</label>
            <select className="input" value={genClientId} onChange={(e) => setGenClientId(e.target.value)}>
              <option value="">Sem cliente vinculado</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-gold w-full" onClick={generate} disabled={generating}>
            {generating ? "Gerando documento..." : "Gerar documento"}
          </button>
          {result && (
            <div className="flex gap-2 pt-2">
              <a href={result.docxPath} download className="btn-secondary flex-1 text-xs">
                <Download size={14} /> Baixar .docx
              </a>
              {result.pdfPath ? (
                <a href={result.pdfPath} download className="btn-secondary flex-1 text-xs">
                  <Download size={14} /> Baixar .pdf
                </a>
              ) : (
                <span className="text-xs text-navy-400 flex items-center">PDF indisponível (LibreOffice não encontrado no servidor)</span>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={openHelp} onClose={() => setOpenHelp(false)} title="Variáveis disponíveis nos modelos">
        <p className="text-sm text-navy-500 mb-3">
          No Word, insira variáveis no formato <code className="bg-navy-50 px-1 rounded">{"{{variavel}}"}</code>. Ao gerar o documento para um
          cliente, elas serão substituídas automaticamente:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {TEMPLATE_PLACEHOLDERS.map((p) => (
            <div key={p.key} className="rounded bg-navy-50 px-2 py-1.5">
              <code className="text-gold-700">{`{{${p.key}}}`}</code>
              <p className="text-navy-400">{p.label}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
