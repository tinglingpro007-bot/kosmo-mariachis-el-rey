import { PageHeader } from "@/components/ui/page-header";
import { listPlans } from "@/domain/plans/repository";
import { listPresentationsByMonth } from "@/domain/presentations/repository";
import { PresentationCalendar } from "@/features/consultar-las-fechas-ocupadas/components/presentation-calendar";
import { currentMonthRef, monthKey } from "@/features/consultar-las-fechas-ocupadas/logic";

export const dynamic = "force-dynamic";

export default async function ConsultarLasFechasOcupadasPage() {
  const month = currentMonthRef();
  const [presentations, plans] = await Promise.all([
    listPresentationsByMonth(monthKey(month)),
    listPlans(),
  ]);

  return (
    <>
      <PageHeader
        title="Calendario de Presentaciones"
        description="Revisa las fechas ya comprometidas con presentaciones confirmadas y las que permanecen libres para nuevas solicitudes."
      />
      <PresentationCalendar
        initialMonth={month}
        initialPresentations={presentations}
        initialPlans={plans}
      />
    </>
  );
}
