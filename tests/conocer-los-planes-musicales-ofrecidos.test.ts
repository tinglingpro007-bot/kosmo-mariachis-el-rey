import { describe, expect, it } from "vitest";

import type { Plan } from "@/db/schema";
import {
  NO_PLANS_FOR_DURATION_MESSAGE,
  REQUIRED_PLAN_FIELDS_MESSAGE,
  durationOptions,
  filterPlansByDuration,
  formatDuration,
  formatPeso,
  planWithoutRateAlerts,
  plansWithoutRate,
  validatePlanForm,
  visiblePlansForCustomer,
} from "@/features/conocer-los-planes-musicales-ofrecidos/logic";

process.env.DATABASE_URL = ":memory:";

const plansRepository = await import("@/domain/plans/repository");

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan_01",
    name: "Serenata Tradicional",
    description: "Interpretación de canciones clásicas por 4 músicos.",
    rate: 2500,
    durationMinutes: 60,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("planes.formatPeso", () => {
  it.each([
    [2500, "$2,500"],
    [15000, "$15,000"],
    [999, "$999"],
    [1234567, "$1,234,567"],
    [0, "$0"],
  ])("formatPeso(%i) => %s", (rate, expected) => {
    // Arrange & Act & Assert
    expect(formatPeso(rate)).toBe(expected);
  });

  it("always prefixes the amount with the $ symbol", () => {
    // Arrange
    const rate = 2500;

    // Act
    const result = formatPeso(rate);

    // Assert
    expect(result.startsWith("$")).toBe(true);
  });
});

describe("planes.formatDuration", () => {
  it.each([
    [30, "30 minutos"],
    [60, "60 minutos"],
    [120, "120 minutos"],
    [1, "1 minuto"],
  ])("formatDuration(%i) => %s", (minutes, expected) => {
    // Arrange & Act & Assert
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("planes.validatePlanForm", () => {
  it("returns the validated plan data when all required fields are complete", () => {
    // Arrange
    const values = {
      name: "  Serenata Tradicional  ",
      description: "Interpretación de canciones clásicas por 4 músicos.",
      rate: "2500",
      durationMinutes: 60,
    };

    // Act
    const result = validatePlanForm(values);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        name: "Serenata Tradicional",
        description: "Interpretación de canciones clásicas por 4 músicos.",
        rate: 2500,
        durationMinutes: 60,
      });
    }
  });

  it("parses a rate written with thousands separator", () => {
    // Arrange
    const values = {
      name: "Paquete Boda Completa",
      description: "Ceremonia, recepción y serenata de arranque.",
      rate: "$15,000",
      durationMinutes: 120,
    };

    // Act
    const result = validatePlanForm(values);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rate).toBe(15000);
    }
  });

  it.each([
    {
      label: "without description",
      values: {
        name: "Serenata Tradicional",
        description: "   ",
        rate: "2500",
        durationMinutes: 60,
      },
    },
    {
      label: "without rate",
      values: {
        name: "Serenata Tradicional",
        description: "Interpretación de canciones clásicas.",
        rate: "",
        durationMinutes: 60,
      },
    },
    {
      label: "without duration",
      values: {
        name: "Serenata Tradicional",
        description: "Interpretación de canciones clásicas.",
        rate: "2500",
        durationMinutes: 0,
      },
    },
    {
      label: "without name",
      values: {
        name: " ",
        description: "Interpretación de canciones clásicas.",
        rate: "2500",
        durationMinutes: 60,
      },
    },
  ])("rejects a plan $label", ({ values }) => {
    // Arrange & Act
    const result = validatePlanForm(values);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Debe completar todos los campos del plan",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-numeric rate", () => {
    // Arrange
    const values = {
      name: "Serenata Tradicional",
      description: "Interpretación de canciones clásicas.",
      rate: "abc",
      durationMinutes: 60,
    };

    // Act
    const result = validatePlanForm(values);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(REQUIRED_PLAN_FIELDS_MESSAGE);
    }
  });
});

describe("planes.visiblePlansForCustomer", () => {
  it("hides plans without a defined rate", () => {
    // Arrange
    const plans = [
      makePlan({ id: "p_visible" }),
      makePlan({ id: "p_hidden", name: "Homenaje Especial", rate: null }),
    ];

    // Act
    const result = visiblePlansForCustomer(plans);

    // Assert
    expect(result.map((plan) => plan.id)).toEqual(["p_visible"]);
  });

  it("returns an empty list when every plan lacks a rate", () => {
    // Arrange
    const plans = [makePlan({ rate: null }), makePlan({ id: "p2", rate: null })];

    // Act
    const result = visiblePlansForCustomer(plans);

    // Assert
    expect(result).toEqual([]);
  });

  it("keeps all priced plans", () => {
    // Arrange
    const plans = [makePlan(), makePlan({ id: "p2", name: "Mañanitas", rate: 800 })];

    // Act
    const result = visiblePlansForCustomer(plans);

    // Assert
    expect(result).toHaveLength(2);
  });
});

describe("planes.plansWithoutRate", () => {
  it("detects plans whose rate is not defined", () => {
    // Arrange
    const plans = [
      makePlan(),
      makePlan({ id: "p_hidden", name: "Homenaje Especial", rate: null }),
    ];

    // Act
    const result = plansWithoutRate(plans);

    // Assert
    expect(result.map((plan) => plan.id)).toEqual(["p_hidden"]);
  });
});

describe("planes.planWithoutRateAlerts", () => {
  it("builds one admin alert per plan without rate", () => {
    // Arrange
    const plans = [
      makePlan(),
      makePlan({ id: "p_hidden", name: "Homenaje Especial", rate: null }),
      makePlan({ id: "p_second", name: "Paquete VIP", rate: null }),
    ];

    // Act
    const result = planWithoutRateAlerts(plans);

    // Assert
    expect(result).toEqual([
      'El plan "Homenaje Especial" no tiene tarifa definida y debe ser corregido',
      'El plan "Paquete VIP" no tiene tarifa definida y debe ser corregido',
    ]);
  });

  it("returns no alerts when every plan has a rate", () => {
    // Arrange
    const plans = [makePlan(), makePlan({ id: "p2", name: "Mañanitas", rate: 800 })];

    // Act
    const result = planWithoutRateAlerts(plans);

    // Assert
    expect(result).toEqual([]);
  });
});

describe("planes.filterPlansByDuration", () => {
  it("returns only the plans that match the selected duration", () => {
    // Arrange
    const plans = [
      makePlan({ id: "p_30", durationMinutes: 30 }),
      makePlan({ id: "p_60", durationMinutes: 60 }),
      makePlan({ id: "p_120", name: "Paquete Boda Completa", durationMinutes: 120 }),
    ];

    // Act
    const result = filterPlansByDuration(plans, 60);

    // Assert
    expect(result.map((plan) => plan.id)).toEqual(["p_60"]);
  });

  it("returns an empty list when no plan matches the duration", () => {
    // Arrange
    const plans = [makePlan({ durationMinutes: 60 })];

    // Act
    const result = filterPlansByDuration(plans, 30);

    // Assert
    expect(result).toEqual([]);
  });

  it("keeps every plan when no filter is applied", () => {
    // Arrange
    const plans = [makePlan({ durationMinutes: 30 }), makePlan({ id: "p2", durationMinutes: 120 })];

    // Act
    const result = filterPlansByDuration(plans, null);

    // Assert
    expect(result).toHaveLength(2);
  });

  it("exports the empty state message required by REQ-1.4", () => {
    // Assert
    expect(NO_PLANS_FOR_DURATION_MESSAGE).toBe(
      "No se encontraron planes con la duración seleccionada",
    );
  });
});

describe("planes.durationOptions", () => {
  it("returns unique durations sorted ascending", () => {
    // Arrange
    const plans = [
      makePlan({ durationMinutes: 120 }),
      makePlan({ id: "p2", durationMinutes: 30 }),
      makePlan({ id: "p3", durationMinutes: 60 }),
      makePlan({ id: "p4", durationMinutes: 120 }),
    ];

    // Act
    const result = durationOptions(plans);

    // Assert
    expect(result).toEqual([30, 60, 120]);
  });
});

describe("plansRepository", () => {
  it("seeds demo plans on a fresh database and lists them ordered by name", async () => {
    // Arrange & Act
    const result = await plansRepository.listPlans();

    // Assert
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.some((plan) => plan.name === "Serenata Tradicional")).toBe(true);
    const names = result.map((plan) => plan.name);
    expect([...names].sort()).toEqual(names);
  });

  it("creates a plan and removes it afterwards", async () => {
    // Arrange
    const input = {
      name: "Ensayo Especial",
      description: "Repertorio acústico para reuniones pequeñas.",
      rate: 900,
      durationMinutes: 45,
    };

    // Act
    const created = await plansRepository.createPlan(input);
    let all = await plansRepository.listPlans();
    const found = all.find((plan) => plan.id === created.id);

    // Assert
    expect(found?.name).toBe("Ensayo Especial");
    expect(found?.rate).toBe(900);
    expect(found?.durationMinutes).toBe(45);

    // Act
    await plansRepository.deletePlan(created.id);
    all = await plansRepository.listPlans();

    // Assert
    expect(all.some((plan) => plan.id === created.id)).toBe(false);
  });
});
