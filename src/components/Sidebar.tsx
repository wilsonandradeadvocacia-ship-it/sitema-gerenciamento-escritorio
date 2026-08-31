"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gavel,
  Users,
  CalendarDays,
  Megaphone,
  Wallet,
  UserSquare2,
  FileStack,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/processos", label: "Processos", icon: Gavel },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/advogados", label: "Advogados", icon: UserSquare2 },
  { href: "/modelos", label: "Meus Modelos", icon: FileStack },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [firm, setFirm] = useState<{ name: string; address: string; city: string; state: string; phone: string; logoPath: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then(setFirm)
      .catch(() => {});
  }, []);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-navy-800 text-white">
      <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-6 border-b border-white/10">
        {firm?.logoPath ? (
          <Image src={firm.logoPath} alt={firm.name} width={56} height={56} className="object-contain" />
        ) : (
          <div className="w-14 h-14 rounded-full border border-gold-300/40 flex items-center justify-center text-gold-300 font-display text-lg">
            {(firm?.name || "?").charAt(0)}
          </div>
        )}
        <div className="text-center">
          <p className="font-display text-lg tracking-wide gold-text">{firm?.name || "Carregando..."}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-white/10 text-gold-300" : "text-navy-100 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {firm && (firm.address || firm.phone) && (
        <div className="px-6 py-4 border-t border-white/10 text-[11px] text-navy-200/70 leading-relaxed">
          {firm.address}
          {firm.phone && (
            <>
              <br />
              {firm.phone}
            </>
          )}
        </div>
      )}
    </aside>
  );
}
