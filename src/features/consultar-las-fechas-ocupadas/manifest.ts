import { CalendarDays } from "lucide-react";

import type { FeatureManifest } from "@/features/types";

export const consultarLasFechasOcupadasManifest: FeatureManifest = {
  slug: "consultar-las-fechas-ocupadas",
  title: "Calendario de Presentaciones",
  description:
    "Revisa el calendario mensual de presentaciones confirmadas y las fechas ya comprometidas con eventos.",
  route: "/consultar-las-fechas-ocupadas",
  icon: CalendarDays,
  group: "Área Administrador de agenda",
  actor: "Administrador de agenda",
};
