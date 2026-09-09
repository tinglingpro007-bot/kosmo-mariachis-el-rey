import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db, sqlite } from "@/db";
import { plans, type NewPlan, type Plan } from "@/db/schema";

export interface PlanInput {
  name: string;
  description: string;
  rate: number;
  durationMinutes: number;
}

const PLANS_DDL = `
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rate INTEGER,
  duration_minutes INTEGER NOT NULL,
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

function seedPlans(): void {
  const seedRows: NewPlan[] = [
    {
      id: randomUUID(),
      name: "Serenata Tradicional",
      description: "Interpretación de canciones clásicas por 4 músicos.",
      rate: 2500,
      durationMinutes: 60,
    },
    {
      id: randomUUID(),
      name: "Paquete Boda Completa",
      description: "Ceremonia, recepción y serenata de arranque para bodas.",
      rate: 15000,
      durationMinutes: 120,
    },
    {
      id: randomUUID(),
      name: "Mañanitas Especiales",
      description: "Mañanitas con mariachi completo para festejar a quien más quieres.",
      rate: 800,
      durationMinutes: 30,
    },
    {
      id: randomUUID(),
      name: "Homenaje Especial",
      description: "Repertorio de homenaje para aniversarios y reconocimientos.",
      rate: null,
      durationMinutes: 90,
    },
  ];
  db.insert(plans).values(seedRows).run();
}

function ensurePlansDatabase(): void {
  if (initialized) return;
  if (!tableExists("plans")) {
    sqlite.exec(PLANS_DDL);
    seedPlans();
  }
  initialized = true;
}

export async function listPlans(): Promise<Plan[]> {
  ensurePlansDatabase();
  const rows = await db.select().from(plans).orderBy(asc(plans.name));
  return rows;
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  ensurePlansDatabase();
  const [row] = await db
    .insert(plans)
    .values({ id: randomUUID(), ...input })
    .returning();
  return row;
}

export async function deletePlan(id: string): Promise<void> {
  ensurePlansDatabase();
  await db.delete(plans).where(eq(plans.id, id));
}
