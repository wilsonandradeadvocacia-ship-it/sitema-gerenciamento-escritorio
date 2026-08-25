import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { URGENCY_MAP } from "@/lib/constants";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("card", className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-navy-900">{title}</h1>
        {subtitle && <p className="text-sm text-navy-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function UrgencyBadge({ urgency }: { urgency?: string | null }) {
  if (!urgency) return null;
  const u = URGENCY_MAP[urgency];
  if (!u) return null;
  return <span className={clsx("badge", u.color)}>{u.label}</span>;
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    ativo: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pendente: "bg-amber-100 text-amber-800 border-amber-200",
    concluido: "bg-navy-100 text-navy-700 border-navy-200",
    suspenso: "bg-orange-100 text-orange-800 border-orange-200",
    arquivado: "bg-gray-100 text-gray-600 border-gray-200",
    encerrado: "bg-gray-100 text-gray-600 border-gray-200",
    cancelado: "bg-red-100 text-red-700 border-red-200",
    novo: "bg-blue-100 text-blue-800 border-blue-200",
    analisado: "bg-navy-100 text-navy-700 border-navy-200",
    prazo_definido: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return <span className={clsx("badge", styles[status] ?? "bg-navy-100 text-navy-700 border-navy-200")}>{status.replace("_", " ")}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <p className="font-display text-lg text-navy-700 mb-1">{title}</p>
      {description && <p className="text-sm text-navy-400 max-w-md mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      <p className="font-display text-3xl text-navy-900 mt-2">{value}</p>
      {hint && <p className="text-xs text-navy-400 mt-1">{hint}</p>}
    </Card>
  );
}
