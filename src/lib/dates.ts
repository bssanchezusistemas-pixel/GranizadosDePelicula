const BOGOTA_TZ = "America/Bogota";

export function fechaHoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function rangoDiaBogota(fecha: string) {
  const inicio = new Date(`${fecha}T00:00:00-05:00`).toISOString();
  const fin = new Date(`${fecha}T23:59:59.999-05:00`).toISOString();
  return { inicio, fin };
}

export function formatHoraBogota(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: BOGOTA_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}
