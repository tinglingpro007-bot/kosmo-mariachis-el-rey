import type { Plan } from "@/db/schema";

export const REQUIRED_PLAN_FIELDS_MESSAGE = "Debe completar todos los campos del plan";
export const NO_PLANS_FOR_DURATION_MESSAGE = "No se encontraron planes con la duración seleccionada";
export const PLAN_DURATION_OPTIONS = [30, 45, 60, 90, 120, 180] as const;

export interface ValidPlanData {
  name: string;
  description: string;
  rate: number;
  durationMinutes: number;
}

export type PlanValidationResult =
  | { ok: true; data: ValidPlanData }
  | { ok: false; error: string };

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function positiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "");
    if (cleaned.length === 0) return null;
    const parsed = Number(cleaned);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function validatePlanForm(values: {
  name: unknown;
  description: unknown;
  rate: unknown;
  durationMinutes: unknown;
}): PlanValidationResult {
  const name = nonEmptyString(values.name);
  const description = nonEmptyString(values.description);
  const rate = positiveInteger(values.rate);
  const durationMinutes = positiveInteger(values.durationMinutes);

  if (!name || !description || rate === null || durationMinutes === null) {
    return { ok: false, error: REQUIRED_PLAN_FIELDS_MESSAGE };
  }

  return { ok: true, data: { name, description, rate, durationMinutes } };
}

export function formatPeso(rate: number): string {
  return `$${rate.toLocaleString("en-US")}`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
}

export function visiblePlansForCustomer(plans: readonly Plan[]): Plan[] {
  return plans.filter((plan) => plan.rate !== null);
}

export function plansWithoutRate(plans: readonly Plan[]): Plan[] {
  return plans.filter((plan) => plan.rate === null);
}

export function planWithoutRateAlerts(plans: readonly Plan[]): string[] {
  return plansWithoutRate(plans).map(
    (plan) => `El plan "${plan.name}" no tiene tarifa definida y debe ser corregido`,
  );
}

export function filterPlansByDuration(
  plans: readonly Plan[],
  minutes: number | null,
): Plan[] {
  if (minutes === null) return [...plans];
  return plans.filter((plan) => plan.durationMinutes === minutes);
}

export function durationOptions(plans: readonly Plan[]): number[] {
  const unique = new Set(plans.map((plan) => plan.durationMinutes));
  return [...unique].sort((a, b) => a - b);
}
