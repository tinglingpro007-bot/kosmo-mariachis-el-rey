import { NextResponse } from "next/server";

import { deletePlan } from "@/domain/plans/repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Bad Request", detail: "El identificador del plan es obligatorio." },
      { status: 400 },
    );
  }

  await deletePlan(id);
  return NextResponse.json({}, { status: 200 });
}
