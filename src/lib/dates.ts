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

/** Lunes de la semana ISO (semana empieza lunes, zona Bogotá). */
export function inicioSemanaBogota(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

export function rangoSemanaBogota(fecha: string) {
  const lunes = inicioSemanaBogota(fecha);
  const [y, m, d] = lunes.split("-").map(Number);
  const domingo = new Date(Date.UTC(y, m - 1, d + 6, 12, 0, 0));
  const domingoStr = domingo.toISOString().slice(0, 10);
  const inicio = rangoDiaBogota(lunes).inicio;
  const fin = rangoDiaBogota(domingoStr).fin;
  return { lunes, domingo: domingoStr, inicio, fin };
}

export function formatHoraBogota(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    timeZone: BOGOTA_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}
