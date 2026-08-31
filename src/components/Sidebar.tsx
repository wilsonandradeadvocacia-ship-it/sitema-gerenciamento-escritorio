"use client";

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
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-navy-800 text-white">
      <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-6 border-b border-white/10">
        <Image src="/brand/logo-icon.png" alt="Wilson Andrade" width={56} height={56} />
        <div className="text-center">
          <p className="font-display text-lg tracking-wide gold-text">WILSON ANDRADE</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/80">Advocacia e Consultoria</p>
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
      <div className="px-6 py-4 border-t border-white/10 text-[11px] text-navy-200/70 leading-relaxed">
        Av. Menino Marcelo, 9350
        <br />
        Sala 611, Serraria, Maceió/AL
        <br />
        (82) 99614-3977
      </div>
    </aside>
  );
}
