import { PageHeader } from "@/components/ui/page-header";
import { listPlans } from "@/domain/plans/repository";
import { PlanesExplorer } from "@/features/conocer-los-planes-musicales-ofrecidos/components/planes-explorer";

export const dynamic = "force-dynamic";

export default async function ConocerLosPlanesMusicalesOfrecidosPage() {
  const plans = await listPlans();

  return (
    <>
      <PageHeader
        title="Planes Musicales"
        description="Conoce los planes de mariachi disponibles para tu evento, con su tarifa y duración."
      />
      <PlanesExplorer initialPlans={plans} />
    </>
  );
}
