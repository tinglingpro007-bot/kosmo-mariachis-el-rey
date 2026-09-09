import { Music } from "lucide-react";

import type { FeatureManifest } from "@/features/types";

export const conocerLosPlanesMusicalesOfrecidosManifest: FeatureManifest = {
  slug: "conocer-los-planes-musicales-ofrecidos",
  title: "Planes Musicales",
  description:
    "Explora los planes de mariachi con su tarifa y duración, o gestiona el catálogo disponible.",
  route: "/conocer-los-planes-musicales-ofrecidos",
  icon: Music,
  group: "Área Cliente",
  actor: "Cliente",
};
