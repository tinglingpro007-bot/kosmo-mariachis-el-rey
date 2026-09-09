import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rate: integer("rate"),
  durationMinutes: integer("duration_minutes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const presentacions = sqliteTable("presentacions", {
  id: text("id").primaryKey(),
  planName: text("plan_name").notNull(),
  clientName: text("client_name").notNull(),
  venue: text("venue").notNull(),
  eventDate: text("event_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Presentacion = typeof presentacions.$inferSelect;
export type NewPresentacion = typeof presentacions.$inferInsert;
