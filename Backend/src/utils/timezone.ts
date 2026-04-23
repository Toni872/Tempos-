const MADRID_TIMEZONE = 'Europe/Madrid';

export type MadridDateTimeParts = {
  dateIso: string;
  timeHHMM: string;
};

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

export function getMadridDateTimeParts(at: Date = new Date()): MadridDateTimeParts {
  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);

  const year = getPart(dateParts, 'year');
  const month = getPart(dateParts, 'month');
  const day = getPart(dateParts, 'day');
  const hour = getPart(timeParts, 'hour');
  const minute = getPart(timeParts, 'minute');

  return {
    dateIso: `${year}-${month}-${day}`,
    timeHHMM: `${hour}:${minute}`,
  };
}

export function toUtcMidnightDate(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}

/**
 * Returns the Madrid UTC offset string (e.g. "+01:00" or "+02:00")
 * dynamically based on the current date (CET vs CEST).
 */
export function getMadridUtcOffset(at: Date = new Date()): string {
  const utcDate = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }));
  const madridDate = new Date(at.toLocaleString('en-US', { timeZone: MADRID_TIMEZONE }));
  const diffMinutes = (madridDate.getTime() - utcDate.getTime()) / 60000;
  const sign = diffMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(diffMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const minutes = String(absMinutes % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}
