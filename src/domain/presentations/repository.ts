import { randomUUID } from "node:crypto";

import { asc, eq, like } from "drizzle-orm";

import { db, sqlite } from "@/db";
import {
  presentacions,
  type NewPresentacion,
  type Presentacion,
} from "@/db/schema";

export interface PresentationInput {
  planName: string;
  clientName: string;
  venue: string;
  eventDate: string;
}

export class PresentationDateTakenError extends Error {
  constructor(eventDate: string) {
    super(`La fecha ${eventDate} ya tiene una presentación confirmada`);
    this.name = "PresentationDateTakenError";
  }
}

const PRESENTACIONES_DDL = `
CREATE TABLE IF NOT EXISTS presentacions (
  id TEXT PRIMARY KEY NOT NULL,
  plan_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
)
`;

let initialized = false;

function tableExists(name: string): boolean {
  return Boolean(
    sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(name),
  );
}

function padDay(value: number): string {
  return String(value).padStart(2, "0");
}

function monthDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${padDay(monthIndex + 1)}-${padDay(day)}`;
}

function shiftMonth(base: Date, delta: number): { year: number; monthIndex: number } {
  const copy = new Date(base.getTime());
  copy.setDate(1);
  copy.setMonth(base.getMonth() + delta);
  return { year: copy.getFullYear(), monthIndex: copy.getMonth() };
}

function seedPresentaciones(): void {
  const now = new Date();
  const current = shiftMonth(now, 0);
  const previous = shiftMonth(now, -1);
  const next = shiftMonth(now, 1);

  const demoRows: NewPresentacion[] = [
    {
      id: randomUUID(),
      planName: "Serenata Tradicional",
      clientName: "Familia Ramírez",
      venue: "Av. Reforma 120, Ciudad de México",
      eventDate: monthDate(current.year, current.monthIndex, 5),
    },
    {
      id: randomUUID(),
      planName: "Paquete Boda Completa",
      clientName: "Hotel Paraíso",
      venue: "Salón Real, Guadalajara",
      eventDate: monthDate(current.year, current.monthIndex, 19),
    },
    {
      id: randomUUID(),
      planName: "Mañanitas Especiales",
      clientName: "María Fernanda López",
      venue: "Calle Hidalgo 45, Querétaro",
      eventDate: monthDate(previous.year, previous.monthIndex, 12),
    },
    {
      id: randomUUID(),
      planName: "Homenaje Especial",
      clientName: "Grupo Cantares",
      venue: "Jardín de las Rosas, Puebla",
      eventDate: monthDate(next.year, next.monthIndex, 8),
    },
  ];
  db.insert(presentacions).values(demoRows).run();
}

function ensurePresentacionesDatabase(): void {
  if (initialized) return;
  if (!tableExists("presentacions")) {
    sqlite.exec(PRESENTACIONES_DDL);
    seedPresentaciones();
  }
  initialized = true;
}

export async function listPresentationsByMonth(monthKey: string): Promise<Presentacion[]> {
  ensurePresentacionesDatabase();
  return db
    .select()
    .from(presentacions)
    .where(like(presentacions.eventDate, `${monthKey}-%`))
    .orderBy(asc(presentacions.eventDate));
}

export async function listAllPresentations(): Promise<Presentacion[]> {
  ensurePresentacionesDatabase();
  return db
    .select()
    .from(presentacions)
    .orderBy(asc(presentacions.eventDate));
}

export async function findPresentationByDate(
  eventDate: string,
): Promise<Presentacion | undefined> {
  ensurePresentacionesDatabase();
  const [row] = await db
    .select()
    .from(presentacions)
    .where(eq(presentacions.eventDate, eventDate))
    .limit(1);
  return row;
}

export async function createPresentation(input: PresentationInput): Promise<Presentacion> {
  ensurePresentacionesDatabase();
  const existing = await findPresentationByDate(input.eventDate);
  if (existing) {
    throw new PresentationDateTakenError(input.eventDate);
  }
  const [row] = await db
    .insert(presentacions)
    .values({ id: randomUUID(), ...input })
    .returning();
  return row;
}
