"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { Plus, Search, Users, Gavel, FileText } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  kind: string;
  cpfCnpj: string | null;
  phone: string | null;
  email: string | null;
  _count: { processes: number; contracts: number };
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  function load(query = "") {
    setLoading(true);
    fetch(`/api/clientes${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json())
      .then(setClients)
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro completo, documentos, processos vinculados e geração de instrumentos"
        actions={
          <Link href="/clientes/novo" className="btn-gold">
            <Plus size={16} /> Novo cliente
          </Link>
        }
      />

      <div className="relative max-w-sm mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
        />
      </div>

      {!loading && clients.length === 0 && (
        <Card>
          <EmptyState
            title="Nenhum cliente cadastrado"
            description="Cadastre clientes para vincular processos, gerar contratos de honorários e procurações."
            action={
              <Link href="/clientes/novo" className="btn-gold">
                <Plus size={16} /> Cadastrar primeiro cliente
              </Link>
            }
          />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((c) => (
          <Link href={`/clientes/${c.id}`} key={c.id}>
            <Card className="p-5 h-full hover:border-gold-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-navy-900 truncate">{c.name}</p>
                  <p className="text-xs text-navy-400">{c.kind === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"} · {c.cpfCnpj || "sem documento"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-navy-500">
                <span className="flex items-center gap-1">
                  <Gavel size={12} /> {c._count.processes} processo(s)
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {c._count.contracts} contrato(s)
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
