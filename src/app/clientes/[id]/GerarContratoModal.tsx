"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Download } from "lucide-react";

const PAYMENT_TYPES = [
  { value: "mensal", label: "Mensal (recorrente)" },
  { value: "avista", label: "À vista" },
  { value: "parcelado", label: "Parcelado" },
  { value: "exito", label: "Honorários de êxito (%)" },
  { value: "hora", label: "Por hora técnica" },
];

export default function GerarContratoModal({
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
  const [form, setForm] = useState({
    processId: "",
    objectText: "",
    paymentType: "mensal",
    totalValue: "",
    installments: "1",
    installmentValue: "",
    dueDay: "10",
    successFeePct: "20",
    bankInfo: "",
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ docxPath: string; pdfPath: string | null } | null>(null);

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`/api/clientes/${clientId}/contrato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult({ docxPath: data.docxPath, pdfPath: data.pdfPath });
      onGenerated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gerar Contrato de Honorários" wide>
      <div className="space-y-3">
        <div>
          <label className="label">Processo vinculado (opcional)</label>
          <select className="input" value={form.processId} onChange={(e) => setForm({ ...form, processId: e.target.value })}>
            <option value="">Consultoria geral / sem processo específico</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.area} {p.number ? `· ${p.number}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Objeto do contrato</label>
          <textarea
            className="input"
            rows={2}
            value={form.objectText}
            onChange={(e) => setForm({ ...form, objectText: e.target.value })}
            placeholder="Prestação de serviço técnico profissional especializado em..."
          />
        </div>
        <div>
          <label className="label">Modalidade de pagamento</label>
          <select className="input" value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
            {PAYMENT_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {(form.paymentType === "avista" || form.paymentType === "parcelado") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor total (R$)</label>
              <input type="number" className="input" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} />
            </div>
            {form.paymentType === "parcelado" && (
              <div>
                <label className="label">Número de parcelas</label>
                <input type="number" className="input" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} />
              </div>
            )}
          </div>
        )}

        {(form.paymentType === "mensal" || form.paymentType === "hora") && (
          <div>
            <label className="label">{form.paymentType === "mensal" ? "Valor mensal (R$)" : "Valor por hora (R$)"}</label>
            <input type="number" className="input" value={form.installmentValue} onChange={(e) => setForm({ ...form, installmentValue: e.target.value })} />
          </div>
        )}

        {["mensal", "parcelado"].includes(form.paymentType) && (
          <div>
            <label className="label">Dia de vencimento</label>
            <input type="number" min={1} max={28} className="input" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} />
          </div>
        )}

        {form.paymentType === "exito" && (
          <div>
            <label className="label">Percentual de êxito (%)</label>
            <input type="number" className="input" value={form.successFeePct} onChange={(e) => setForm({ ...form, successFeePct: e.target.value })} />
          </div>
        )}

        <div>
          <label className="label">Dados bancários (opcional — usa os do escritório se vazio)</label>
          <input className="input" value={form.bankInfo} onChange={(e) => setForm({ ...form, bankInfo: e.target.value })} />
        </div>

        <button className="btn-gold w-full" onClick={save} disabled={!form.objectText || saving}>
          {saving ? "Gerando contrato..." : "Gerar contrato"}
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
