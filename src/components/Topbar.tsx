"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import NovosModal from "@/components/NovosModal";

export default function Topbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-navy-100 bg-white/80 backdrop-blur px-6 py-3 lg:px-10">
      <div className="relative w-full max-w-sm hidden sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
        <input
          className="input pl-9"
          placeholder="Buscar cliente, processo, publicação..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value;
              if (q) window.location.href = `/buscar?q=${encodeURIComponent(q)}`;
            }
          }}
        />
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <button onClick={() => setOpen(true)} className="btn-gold">
          <Plus size={16} />
          Novos
        </button>
      </div>
      <NovosModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
