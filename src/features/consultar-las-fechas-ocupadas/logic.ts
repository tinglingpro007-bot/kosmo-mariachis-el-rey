import type { Presentacion } from "@/db/schema";

export const CALENDAR_LOAD_ERROR_MESSAGE =
  "No se pudo cargar el calendario. Intente nuevamente";
export const PRESENTATION_FIELDS_MESSAGE =
  "Debe completar todos los campos de la presentación";
export const INVALID_EVENT_DATE_MESSAGE = "La fecha del evento no es válida";
export const PRESENTATION_CREATED_MESSAGE =
  "Presentación confirmada. La fecha quedó marcada como ocupada en el calendario.";

export const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export interface MonthRef {
  year: number;
  month: number;
}

export interface ValidPresentationData {
  clientName: string;
  planId: string;
  eventDate: string;
  venue: string;
}

export type PresentationValidationResult =
  | { ok: true; data: ValidPresentationData }
  | { ok: false; error: string };

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function monthKey(ref: MonthRef): string {
  return `${ref.year}-${pad2(ref.month + 1)}`;
}

export function currentMonthRef(): MonthRef {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function parseMonthKey(value: unknown): MonthRef | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11 || year < 1970 || year > 9999) return null;
  return { year, month: monthIndex };
}

function ordinal(ref: MonthRef): number {
  return ref.year * 12 + ref.month;
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const total = ordinal(ref) + delta;
  return { year: Math.floor(total / 12), month: total % 12 };
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  return ordinal(a) - ordinal(b);
}

export function monthLabel(ref: MonthRef): string {
  const name = MONTH_NAMES[ref.month] ?? "";
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  return `${capitalized} de ${ref.year}`;
}

export function daysInMonth(ref: MonthRef): number {
  return new Date(Date.UTC(ref.year, ref.month + 1, 0)).getUTCDate();
}

export function firstWeekday(ref: MonthRef): number {
  return new Date(Date.UTC(ref.year, ref.month, 1)).getUTCDay();
}

export function dateKey(ref: MonthRef, day: number): string {
  return `${monthKey(ref)}-${pad2(day)}`;
}

export function formatEventDateLabel(eventDate: string): string {
  const [year, monthIndex, day] = eventDate.split("-").map(Number);
  const monthName = MONTH_NAMES[(monthIndex ?? 1) - 1] ?? "";
  return `${day} de ${monthName} de ${year}`;
}

export function monthPresentationsByDate(
  presentations: readonly Presentacion[],
): Map<string, Presentacion[]> {
  const byDate = new Map<string, Presentacion[]>();
  for (const presentation of presentations) {
    const list = byDate.get(presentation.eventDate) ?? [];
    list.push(presentation);
    byDate.set(presentation.eventDate, list);
  }
  return byDate;
}

export function presentationsOnDate(
  byDate: Map<string, Presentacion[]>,
  date: string,
): Presentacion[] {
  return byDate.get(date) ?? [];
}

export type CalendarGrid = (number | null)[][];

export function buildCalendarGrid(ref: MonthRef): CalendarGrid {
  const totalDays = daysInMonth(ref);
  const leading = firstWeekday(ref);
  const cells: (number | null)[] = [];
  for (let index = 0; index < leading; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(day);
  }
  const weeks: CalendarGrid = [];
  for (let start = 0; start < cells.length; start += 7) {
    const week = cells.slice(start, start + 7);
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }
  return weeks;
}

export interface MonthOption {
  value: string;
  label: string;
}

export function monthOptionsAround(center: MonthRef, span: number): MonthOption[] {
  const options: MonthOption[] = [];
  for (let offset = -span; offset <= span; offset += 1) {
    const ref = addMonths(center, offset);
    options.push({ value: monthKey(ref), label: monthLabel(ref) });
  }
  return options;
}

export function presentationTooltip(presentation: Presentacion): string {
  return [
    `Cliente: ${presentation.clientName}`,
    `Plan: ${presentation.planName}`,
    `Lugar: ${presentation.venue}`,
  ].join("\n");
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, monthIndex, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === monthIndex - 1 &&
    date.getUTCDate() === day
  );
}

export function validatePresentationForm(values: {
  clientName: unknown;
  planId: unknown;
  eventDate: unknown;
  venue: unknown;
}): PresentationValidationResult {
  const clientName = nonEmptyString(values.clientName);
  const planId = nonEmptyString(values.planId);
  const venue = nonEmptyString(values.venue);

  if (!clientName || !planId || !venue) {
    return { ok: false, error: PRESENTATION_FIELDS_MESSAGE };
  }
  if (!isValidDateString(values.eventDate)) {
    return { ok: false, error: INVALID_EVENT_DATE_MESSAGE };
  }

  return { ok: true, data: { clientName, planId, venue, eventDate: values.eventDate } };
}
