"use client";

import { useEffect, useRef, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { Save, CheckCircle2 } from "lucide-react";

const FIELDS: { key: string; label: string; placeholder?: string; span?: 1 | 2 }[] = [
  { key: "name", label: "Nome do escritório", placeholder: "Ex: Silva & Costa Advocacia", span: 2 },
  { key: "lawyer", label: "Advogado(a) responsável", placeholder: "Nome completo" },
  { key: "oab", label: "OAB", placeholder: "OAB/UF 000.000" },
  { key: "cpf", label: "CPF do(a) responsável", placeholder: "000.000.000-00" },
  { key: "cnpj", label: "CNPJ (se PJ)", placeholder: "00.000.000/0001-00" },
  { key: "companyName", label: "Razão social (contrato de honorários)", placeholder: "Ex: FULANO DE TAL SOCIEDADE INDIVIDUAL DE ADVOCACIA", span: 2 },
  { key: "address", label: "Endereço completo", placeholder: "Rua, número, bairro, cidade/UF, CEP", span: 2 },
  { key: "city", label: "Cidade" },
  { key: "state", label: "UF" },
  { key: "phone", label: "Telefone", placeholder: "(00) 00000-0000" },
  { key: "email", label: "E-mail", placeholder: "contato@seuescritorio.com.br" },
  { key: "bank", label: "Dados bancários (cláusula de pagamento)", placeholder: "Banco, agência, conta, chave PIX", span: 2 },
];

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFullPreview, setLogoFullPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFullFile, setLogoFullFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const logoFullRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((data) => {
        setForm(data);
        setLogoPreview(data.logoPath || null);
        setLogoFullPreview(data.logoFullPath || null);
      });
  }
  useEffect(load, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const body = new FormData();
      for (const f of FIELDS) body.set(f.key, form[f.key] ?? "");
      if (logoFile) body.set("logo", logoFile);
      if (logoFullFile) body.set("logoFull", logoFullFile);
      const res = await fetch("/api/configuracoes", { method: "POST", body });
      const data = await res.json();
      setForm(data);
      setLogoPreview(data.logoPath || null);
      setLogoFullPreview(data.logoFullPath || null);
      setLogoFile(null);
      setLogoFullFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Configurações do Escritório"
        subtitle="Esses dados são usados na Procuração, no Contrato de Honorários, nos modelos gerados e nas artes de marketing"
      />

      <Card className="p-5 mb-6">
        <h3 className="font-display text-base text-navy-900 mb-3">Identidade visual</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="label">Logo (ícone, usado na barra lateral e nas artes de marketing)</label>
            <div className="flex items-center gap-3 mt-1">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoFile ? URL.createObjectURL(logoFile) : logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded border border-navy-100" />
              ) : (
                <div className="w-16 h-16 rounded border border-dashed border-navy-200 flex items-center justify-center text-[10px] text-navy-400 text-center px-1">
                  Sem logo
                </div>
              )}
              <button className="btn-secondary text-xs" onClick={() => logoRef.current?.click()}>
                Enviar logo
              </button>
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])}
              />
            </div>
          </div>
          <div>
            <label className="label">Logo do timbrado (cabeçalho dos documentos .docx)</label>
            <div className="flex items-center gap-3 mt-1">
              {logoFullPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoFullFile ? URL.createObjectURL(logoFullFile) : logoFullPreview}
                  alt="Logo do timbrado"
                  className="h-16 object-contain rounded border border-navy-100"
                />
              ) : (
                <div className="w-16 h-16 rounded border border-dashed border-navy-200 flex items-center justify-center text-[10px] text-navy-400 text-center px-1">
                  Sem imagem
                </div>
              )}
              <button className="btn-secondary text-xs" onClick={() => logoFullRef.current?.click()}>
                Enviar imagem
              </button>
              <input
                ref={logoFullRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setLogoFullFile(e.target.files[0])}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 mb-6">
        <h3 className="font-display text-base text-navy-900 mb-3">Dados do escritório</h3>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
              <label className="label">{f.label}</label>
              <input
                className="input"
                placeholder={f.placeholder}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button className="btn-gold" onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={16} /> Salvo
          </span>
        )}
      </div>
    </div>
  );
}
