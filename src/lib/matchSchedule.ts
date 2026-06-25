const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS: Record<string, string> = {
  Sun: 'Dom',
  Mon: 'Seg',
  Tue: 'Ter',
  Wed: 'Qua',
  Thu: 'Qui',
  Fri: 'Sex',
  Sat: 'Sáb',
};
const TZ = 'America/Sao_Paulo';

/**
 * Formata o início do jogo (ISO 8601) em horário de Brasília: "25/jun Qui 16:00".
 * Retorna null para ISO inválido.
 */
export function formatKickoff(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  const month = MONTHS[Number(parts.month) - 1] ?? parts.month;
  const weekday = WEEKDAYS[parts.weekday ?? ''] ?? parts.weekday;
  return `${parts.day}/${month} ${weekday} ${parts.hour}:${parts.minute}`;
}

/** Linha pronta de agenda: "25/jun Qui 16:00 · Cidade / Estádio" (sem o que faltar). */
export function scheduleLine(kickoff?: string, venue?: string): string {
  const when = kickoff ? formatKickoff(kickoff) : null;
  return [when, venue].filter(Boolean).join(' · ');
}
