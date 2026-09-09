import type { FeatureGroup, FeatureManifest } from "@/features/types";
import { conocerLosPlanesMusicalesOfrecidosManifest } from "@/features/conocer-los-planes-musicales-ofrecidos/manifest";
import { consultarLasFechasOcupadasManifest } from "@/features/consultar-las-fechas-ocupadas/manifest";

export const features: FeatureManifest[] = [
  conocerLosPlanesMusicalesOfrecidosManifest,
  consultarLasFechasOcupadasManifest,
];

export const featureGroups: FeatureGroup[] = [
  {
    label: "Área Cliente",
    features: [conocerLosPlanesMusicalesOfrecidosManifest],
  },
  {
    label: "Área Administrador de agenda",
    features: [consultarLasFechasOcupadasManifest],
  },
];
