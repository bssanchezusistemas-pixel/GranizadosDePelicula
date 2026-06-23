import { getMeseroSession } from "@/lib/mesero-session";
import { CajaShell } from "./CajaShell";

export default async function CajaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mesero = await getMeseroSession();
  return <CajaShell mesero={mesero}>{children}</CajaShell>;
}
