"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { CLIENT_DOC_TYPES } from "@/lib/constants";

const ESTADOS = ["AL", "SE", "PE", "BA", "PB", "RN", "CE", "SP", "RJ", "MG", "DF", "Outro"];

export default function NovoClientePage() {
  return (
    <Suspense fallback={<p className="text-navy-400 text-sm">Carregando...</p>}>
      <NovoClienteForm />
    </Suspense>
  );
}

function NovoClienteForm() {
  const router = useRouter();
  const search = useSearchParams();
  const intakeId = search.get("intakeId");
  const fileName = search.get("fileName");
  const prefName = search.get("name") || "";

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    kind: "PF",
    name: prefName,
    cpfCnpj: "",
    rg: "",
    maritalStatus: "",
    profession: "",
    nationality: "brasileiro(a)",
    legalRepName: "",
    legalRepCpf: "",
    address: "",
    city: "Maceió",
    state: "AL",
    zip: "",
    phone: "",
    email: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const client = await res.json();

      if (intakeId) {
        await fetch(`/api/intake/${intakeId}/attach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: client.id, docType: "Outro" }),
        });
      }

      router.push(`/clientes/${client.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Novo Cliente" subtitle="Preencha os dados necessários para procuração, contrato e cadastro financeiro" />

      {intakeId && fileName && (
        <div className="mb-5 rounded-lg border border-gold-200 bg-gold-50/50 px-4 py-3 text-sm text-navy-700">
          Criando cliente a partir do documento <strong>{fileName}</strong>. Complete os campos que a IA não conseguiu preencher automaticamente.
        </div>
      )}

      <Card className="p-6 space-y-5">
        <div>
          <label className="label">Tipo</label>
          <div className="flex gap-2">
            <button
              className={`btn-secondary ${form.kind === "PF" ? "!bg-navy-800 !text-white" : ""}`}
              onClick={() => set("kind", "PF")}
              type="button"
            >
              Pessoa Física
            </button>
            <button
              className={`btn-secondary ${form.kind === "PJ" ? "!bg-navy-800 !text-white" : ""}`}
              onClick={() => set("kind", "PJ")}
              type="button"
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>

        <div>
          <label className="label">{form.kind === "PJ" ? "Razão social" : "Nome completo"}</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{form.kind === "PJ" ? "CNPJ" : "CPF"}</label>
            <input className="input" value={form.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} />
          </div>
          <div>
            <label className="label">{form.kind === "PJ" ? "Inscrição Estadual" : "RG"}</label>
            <input className="input" value={form.rg} onChange={(e) => set("rg", e.target.value)} />
          </div>
        </div>

        {form.kind === "PF" ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Estado civil</label>
              <select className="input" value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">Selecione</option>
                <option>Solteiro(a)</option>
                <option>Casado(a)</option>
                <option>Divorciado(a)</option>
                <option>Viúvo(a)</option>
                <option>União estável</option>
              </select>
            </div>
            <div>
              <label className="label">Profissão</label>
              <input className="input" value={form.profession} onChange={(e) => set("profession", e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Representante legal</label>
              <input className="input" value={form.legalRepName} onChange={(e) => set("legalRepName", e.target.value)} />
            </div>
            <div>
              <label className="label">CPF do representante</label>
              <input className="input" value={form.legalRepCpf} onChange={(e) => set("legalRepCpf", e.target.value)} />
            </div>
          </div>
        )}

        <div>
          <label className="label">Endereço</label>
          <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.state} onChange={(e) => set("state", e.target.value)}>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">CEP</label>
            <input className="input" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={() => router.back()} type="button">
            Cancelar
          </button>
          <button className="btn-gold" onClick={save} disabled={!form.name || saving}>
            {saving ? "Salvando..." : "Salvar cliente"}
          </button>
        </div>
      </Card>
    </div>
  );
}
