import { getCajaSession } from "@/lib/mesero-session";
import { CajaShell } from "./CajaShell";

export default async function CajaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCajaSession();
  return <CajaShell session={session}>{children}</CajaShell>;
}
