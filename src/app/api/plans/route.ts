import { NextResponse } from "next/server";

import { createPlan, listPlans } from "@/domain/plans/repository";
import { validatePlanForm } from "@/features/conocer-los-planes-musicales-ofrecidos/logic";

export async function GET() {
  const plans = await listPlans();
  return NextResponse.json({ data: plans }, { status: 200 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json(
      { error: "Bad Request", detail: "El cuerpo de la solicitud no es válido." },
      { status: 400 },
    );
  }

  const validation = validatePlanForm({
    name: body.name,
    description: body.description,
    rate: body.rate,
    durationMinutes: body.durationMinutes,
  });

  if (!validation.ok) {
    return NextResponse.json(
      { error: "Bad Request", detail: validation.error },
      { status: 422 },
    );
  }

  const plan = await createPlan(validation.data);
  return NextResponse.json({ data: plan }, { status: 201 });
}
