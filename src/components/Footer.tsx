import { BUSINESS } from "@/data/menu";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-cinema-black py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
        <p className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.25em] text-white">
          {BUSINESS.name}
        </p>
        <p className="text-xs text-white/40">
          {BUSINESS.address} · {BUSINESS.city}
        </p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/25">
          Demo premium · Precios referenciales
        </p>
        <a
          href="/admin/domicilios"
          className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/20 transition hover:text-neon"
        >
          Panel domicilios
        </a>
      </div>
    </footer>
  );
}
