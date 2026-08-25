"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Download } from "lucide-react";

export default function GerarProcuracaoModal({
  open,
  onClose,
  clientId,
  processes,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  processes: { id: string; area: string; number: string | null }[];
  onGenerated: () => void;
}) {
  const [processId, setProcessId] = useState("");
  const [scopeText, setScopeText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ docxPath: string; pdfPath: string | null } | null>(null);

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`/api/clientes/${clientId}/procuracao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processId: processId || undefined, scopeText: scopeText || undefined }),
      });
      const data = await res.json();
      setResult({ docxPath: data.docxPath, pdfPath: data.pdfPath });
      onGenerated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gerar Procuração">
      <div className="space-y-3">
        <div>
          <label className="label">Processo vinculado (opcional)</label>
          <select className="input" value={processId} onChange={(e) => setProcessId(e.target.value)}>
            <option value="">Poderes gerais (Ad Judicia et Extra)</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.area} {p.number ? `· ${p.number}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Observações adicionais aos poderes (opcional)</label>
          <textarea className="input" rows={3} value={scopeText} onChange={(e) => setScopeText(e.target.value)} placeholder="Ex: poderes especiais para representar junto à SEFAZ/AL..." />
        </div>
        <button className="btn-gold w-full" onClick={save} disabled={saving}>
          {saving ? "Gerando procuração..." : "Gerar procuração"}
        </button>
        {result && (
          <div className="flex gap-2 pt-2">
            <a href={result.docxPath} download className="btn-secondary flex-1 text-xs justify-center">
              <Download size={14} /> Baixar .docx
            </a>
            {result.pdfPath && (
              <a href={result.pdfPath} download className="btn-secondary flex-1 text-xs justify-center">
                <Download size={14} /> Baixar .pdf
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
