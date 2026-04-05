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
