import { DomiciliosPanel } from "@/components/caja/DomiciliosPanel";

export const metadata = {
  title: "Domicilios — Granizados de Película",
};

export default function CajaDomiciliosPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <DomiciliosPanel />
    </main>
  );
}
