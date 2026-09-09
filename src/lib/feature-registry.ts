import type { FeatureGroup, FeatureManifest } from "@/features/types";
import { conocerLosPlanesMusicalesOfrecidosManifest } from "@/features/conocer-los-planes-musicales-ofrecidos/manifest";

export const features: FeatureManifest[] = [conocerLosPlanesMusicalesOfrecidosManifest];

export const featureGroups: FeatureGroup[] = [
  {
    label: "Área Cliente",
    features: [conocerLosPlanesMusicalesOfrecidosManifest],
  },
];
