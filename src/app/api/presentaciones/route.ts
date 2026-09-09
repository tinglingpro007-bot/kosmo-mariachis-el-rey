import { NextResponse } from "next/server";

import {
  PresentationDateTakenError,
  createPresentation,
  listPresentationsByMonth,
} from "@/domain/presentations/repository";
import { listPlans } from "@/domain/plans/repository";
import {
  currentMonthRef,
  monthKey,
  parseMonthKey,
  validatePresentationForm,
} from "@/features/consultar-las-fechas-ocupadas/logic";

function badRequest(detail: string) {
  return NextResponse.json(
    { error: "Bad Request", detail },
    { status: 400 },
  );
}

function unprocessable(detail: string) {
  return NextResponse.json(
    { error: "Unprocessable Entity", detail },
    { status: 422 },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  const ref = monthParam ? parseMonthKey(monthParam) : currentMonthRef();

  if (!ref) {
    return badRequest("El parámetro month debe tener el formato AAAA-MM.");
  }

  const presentations = await listPresentationsByMonth(monthKey(ref));
  return NextResponse.json({ data: presentations }, { status: 200 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return badRequest("El cuerpo de la solicitud no es válido.");
  }

  const validation = validatePresentationForm({
    clientName: body.clientName,
    planId: body.planId,
    eventDate: body.eventDate,
    venue: body.venue,
  });

  if (!validation.ok) {
    return unprocessable(validation.error);
  }

  const plan = (await listPlans()).find(
    (candidate) => candidate.id === validation.data.planId,
  );
  if (!plan) {
    return unprocessable("El plan seleccionado no existe o ya fue eliminado.");
  }

  try {
    const presentation = await createPresentation({
      planName: plan.name,
      clientName: validation.data.clientName,
      venue: validation.data.venue,
      eventDate: validation.data.eventDate,
    });
    return NextResponse.json({ data: presentation }, { status: 201 });
  } catch (error) {
    if (error instanceof PresentationDateTakenError) {
      return unprocessable(
        "La fecha seleccionada ya tiene una presentación confirmada.",
      );
    }
    throw error;
  }
}
