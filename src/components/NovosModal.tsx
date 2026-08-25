"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { UploadCloud, FileText, Sparkles, Loader2, Check } from "lucide-react";
import { CLIENT_DOC_TYPES } from "@/lib/constants";

interface IntakeResult {
  id: string;
  fileName: string;
  filePath: string;
  suggestion: string;
  status: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export default function NovosModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<IntakeResult[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetch("/api/clientes")
        .then((r) => r.json())
        .then((data) => setClients(data.map((c: any) => ({ id: c.id, name: c.name }))))
        .catch(() => {});
      setResults([]);
    }
  }, [open]);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/intake", { method: "POST", body: form });
      const data = await res.json();
      setResults((prev) => [...data, ...prev]);
    } finally {
      setUploading(false);
    }
  }

  async function attachToClient(intakeId: string, clientId: string, docType: string) {
    setBusyId(intakeId);
    try {
      await fetch(`/api/intake/${intakeId}/attach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, docType }),
      });
      setResults((prev) => prev.map((r) => (r.id === intakeId ? { ...r, status: "processado" } : r)));
    } finally {
      setBusyId(null);
    }
  }

  function goCreateClient(intakeId: string, fileName: string, extracted: Record<string, any>) {
    const params = new URLSearchParams({ intakeId, fileName });
    if (extracted?.name) params.set("name", extracted.name);
    onClose();
    router.push(`/clientes/novo?${params.toString()}`);
  }

  return (
    <Modal open={open} onClose={onClose} title="Novos documentos" wide>
      <div
        className="border-2 border-dashed border-gold-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gold-50/40 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="mx-auto text-gold-500 mb-2" size={32} />
        <p className="text-sm text-navy-600 font-medium">Arraste arquivos aqui ou clique para selecionar</p>
        <p className="text-xs text-navy-400 mt-1">A IA vai sugerir automaticamente onde cada documento deve ser arquivado</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-navy-500 mt-4">
          <Loader2 size={16} className="animate-spin" /> Analisando documentos...
        </div>
      )}

      <div className="mt-5 space-y-3">
        {results.map((r) => {
          const s = JSON.parse(r.suggestion || "{}");
          const isClientDoc = s.kind === "documento_cliente" || s.kind === "novo_cliente";
          return (
            <div key={r.id} className="rounded-xl border border-navy-100 p-4">
              <div className="flex items-start gap-3">
                <FileText className="text-navy-400 shrink-0 mt-0.5" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-800 truncate">{r.fileName}</p>
                  <p className="text-xs text-navy-400 mt-0.5 flex items-center gap-1">
                    <Sparkles size={12} className="text-gold-500" /> {s.reasoning}
                  </p>

                  {r.status === "processado" ? (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <Check size={14} /> Arquivado
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {isClientDoc && (
                        <>
                          <select
                            id={`sel-${r.id}`}
                            className="input w-auto text-xs py-1.5"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Vincular a cliente existente...
                            </option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <select id={`type-${r.id}`} className="input w-auto text-xs py-1.5" defaultValue={s.extracted?.docType || "Outro"}>
                            {CLIENT_DOC_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            disabled={busyId === r.id}
                            className="btn-secondary text-xs py-1.5"
                            onClick={() => {
                              const sel = document.getElementById(`sel-${r.id}`) as HTMLSelectElement;
                              const type = document.getElementById(`type-${r.id}`) as HTMLSelectElement;
                              if (sel.value) attachToClient(r.id, sel.value, type.value);
                            }}
                          >
                            Anexar ao cliente
                          </button>
                          <button
                            className="btn-gold text-xs py-1.5"
                            onClick={() => goCreateClient(r.id, r.fileName, s.extracted || {})}
                          >
                            Cadastrar novo cliente
                          </button>
                        </>
                      )}
                      {s.kind === "financeiro" && (
                        <a href="/financeiro" className="btn-secondary text-xs py-1.5">
                          Ir para Financeiro (extrato)
                        </a>
                      )}
                      {s.kind === "desconhecido" && (
                        <span className="text-xs text-navy-400">Classifique manualmente na área correspondente.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
