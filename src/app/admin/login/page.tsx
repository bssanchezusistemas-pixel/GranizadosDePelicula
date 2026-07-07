import { BUSINESS } from "@/data/menu";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cinema-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-cinema-dark p-8">
        <p className="text-[11px] uppercase tracking-[0.35em] text-neon">
          Administración
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl uppercase text-white">
          {BUSINESS.name}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Inicia sesión para editar productos y ver el registro.
        </p>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
