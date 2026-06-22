interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  subVariant?: "default" | "warn" | "ok";
}

export function MetricCard({
  label,
  value,
  sub,
  subVariant = "default",
}: MetricCardProps) {
  const subColor =
    subVariant === "warn"
      ? "text-red-400"
      : subVariant === "ok"
        ? "text-emerald-400"
        : "text-zinc-500";

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="absolute left-0 top-0 h-full w-[3px] bg-neon" />
      <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="font-black text-2xl tracking-tight">{value}</div>
      {sub && <div className={`mt-1 text-xs ${subColor}`}>{sub}</div>}
    </div>
  );
}
