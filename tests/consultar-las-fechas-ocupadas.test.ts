import { describe, expect, it } from "vitest";

import type { Presentacion } from "@/db/schema";
import {
  CALENDAR_LOAD_ERROR_MESSAGE,
  INVALID_EVENT_DATE_MESSAGE,
  MONTH_NAMES,
  PRESENTATION_FIELDS_MESSAGE,
  PRESENTATION_CREATED_MESSAGE,
  WEEKDAY_LABELS,
  addMonths,
  buildCalendarGrid,
  compareMonths,
  currentMonthRef,
  dateKey,
  daysInMonth,
  firstWeekday,
  formatEventDateLabel,
  monthKey,
  monthLabel,
  monthOptionsAround,
  monthPresentationsByDate,
  parseMonthKey,
  presentationTooltip,
  presentationsOnDate,
  validatePresentationForm,
} from "@/features/consultar-las-fechas-ocupadas/logic";

process.env.DATABASE_URL = ":memory:";

const presentationsRepository = await import("@/domain/presentations/repository");

function makePresentation(overrides: Partial<Presentacion> = {}): Presentacion {
  return {
    id: "pres_01",
    planName: "Serenata Tradicional",
    clientName: "Familia Ramírez",
    venue: "Av. Reforma 120, Ciudad de México",
    eventDate: "2026-09-15",
    createdAt: new Date("2026-08-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("fechas.errores requeridos por REQ-3.5", () => {
  it("exporta el mensaje exacto de error de carga del calendario", () => {
    expect(CALENDAR_LOAD_ERROR_MESSAGE).toBe(
      "No se pudo cargar el calendario. Intente nuevamente",
    );
  });

  it("exporta el mensaje de confirmación de presentación", () => {
    expect(PRESENTATION_CREATED_MESSAGE).toContain("quedó marcada como ocupada");
  });
});

describe("fechas.mes", () => {
  it("monthKey devuelve AAAA-MM a partir de un mes 0-indexado", () => {
    expect(monthKey({ year: 2026, month: 8 })).toBe("2026-09");
    expect(monthKey({ year: 2026, month: 11 })).toBe("2026-12");
  });

  it("addMonths cruza el límite de año en ambas direcciones", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths({ year: 2027, month: 0 }, -1)).toEqual({ year: 2026, month: 11 });
    expect(addMonths({ year: 2026, month: 5 }, 3)).toEqual({ year: 2026, month: 8 });
  });

  it("compareMonths ordena correctamente", () => {
    expect(compareMonths({ year: 2026, month: 11 }, { year: 2027, month: 0 })).toBeLessThan(0);
    expect(compareMonths({ year: 2027, month: 0 }, { year: 2027, month: 0 })).toBe(0);
  });

  it("currentMonthRef devuelve el mes real actual", () => {
    const now = new Date();
    expect(currentMonthRef()).toEqual({
      year: now.getFullYear(),
      month: now.getMonth(),
    });
  });

  it("parseMonthKey acepta un período válido", () => {
    expect(parseMonthKey("2026-12")).toEqual({ year: 2026, month: 11 });
    expect(parseMonthKey("2026-01")).toEqual({ year: 2026, month: 0 });
  });

  it.each([
    ["no string", 202609],
    ["mes fuera de rango", "2026-13"],
    ["formato corto", "2026-9"],
    ["basura", "abc"],
    ["mes cero", "2026-00"],
  ])("parseMonthKey rechaza %s", (_label, value) => {
    expect(parseMonthKey(value)).toBeNull();
  });

  it("monthLabel devuelve el nombre del mes en español", () => {
    expect(monthLabel({ year: 2026, month: 11 })).toBe("Diciembre de 2026");
    expect(monthLabel({ year: 2026, month: 8 })).toBe("Septiembre de 2026");
  });

  it("expone los 12 nombres de mes", () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe("enero");
  });

  it("expone los 7 días de la semana empezando por domingo", () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(WEEKDAY_LABELS[0]).toBe("Dom");
  });

  it("daysInMonth respeta años bisiestos", () => {
    expect(daysInMonth({ year: 2026, month: 1 })).toBe(28);
    expect(daysInMonth({ year: 2024, month: 1 })).toBe(29);
    expect(daysInMonth({ year: 2026, month: 8 })).toBe(30);
  });

  it("firstWeekday indica el día de la semana del día 1", () => {
    expect(firstWeekday({ year: 2026, month: 8 })).toBe(2);
    expect(firstWeekday({ year: 2026, month: 0 })).toBe(4);
  });

  it("dateKey combina mes y día con cero a la izquierda", () => {
    expect(dateKey({ year: 2026, month: 8 }, 5)).toBe("2026-09-05");
  });
});

describe("fechas.buildCalendarGrid", () => {
  it("construye la cuadrícula de septiembre 2026 (5 semanas)", () => {
    const grid = buildCalendarGrid({ year: 2026, month: 8 });

    expect(grid).toHaveLength(5);
    expect(grid[0]).toEqual([null, null, 1, 2, 3, 4, 5]);
    expect(grid[4].filter((cell) => cell !== null)).toEqual([27, 28, 29, 30]);
    const allDays = grid.flat().filter((cell) => cell !== null);
    expect(allDays).toHaveLength(30);
  });

  it("coloca el día 1 en la columna correcta para un mes que inicia jueves", () => {
    const grid = buildCalendarGrid({ year: 2026, month: 0 });

    expect(grid[0]).toEqual([null, null, null, null, 1, 2, 3]);
  });
});

describe("fechas.agrupacion por fecha", () => {
  const presentations = [
    makePresentation({ id: "a", eventDate: "2026-09-15" }),
    makePresentation({ id: "b", eventDate: "2026-09-15", clientName: "Hotel Paraíso" }),
    makePresentation({ id: "c", eventDate: "2026-09-22" }),
    makePresentation({ id: "d", eventDate: "2026-10-05" }),
  ];

  it("agrupa las presentaciones por su fecha exacta", () => {
    const byDate = monthPresentationsByDate(presentations);

    expect(presentationsOnDate(byDate, "2026-09-15")).toHaveLength(2);
    expect(presentationsOnDate(byDate, "2026-09-22")).toHaveLength(1);
    expect(presentationsOnDate(byDate, "2026-10-05")).toHaveLength(1);
  });

  it("devuelve lista vacía para fechas sin presentaciones", () => {
    const byDate = monthPresentationsByDate(presentations);

    expect(presentationsOnDate(byDate, "2026-09-01")).toEqual([]);
  });
});

describe("fechas.presentationTooltip", () => {
  it("incluye cliente, plan y lugar en el resumen", () => {
    const tooltip = presentationTooltip(makePresentation());

    expect(tooltip).toContain("Cliente: Familia Ramírez");
    expect(tooltip).toContain("Plan: Serenata Tradicional");
    expect(tooltip).toContain("Lugar: Av. Reforma 120, Ciudad de México");
  });
});

describe("fechas.formatEventDateLabel", () => {
  it("formatea una fecha ISO a texto legible", () => {
    expect(formatEventDateLabel("2026-09-15")).toBe("15 de septiembre de 2026");
    expect(formatEventDateLabel("2026-12-01")).toBe("1 de diciembre de 2026");
  });
});

describe("fechas.monthOptionsAround", () => {
  it("genera opciones centradas en el mes dado con el rango pedido", () => {
    const options = monthOptionsAround({ year: 2026, month: 8 }, 2);

    expect(options).toHaveLength(5);
    expect(options.map((option) => option.value)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    expect(options[2].label).toBe("Septiembre de 2026");
  });
});

describe("fechas.validatePresentationForm", () => {
  it("acepta una presentación con todos los campos válidos", () => {
    const result = validatePresentationForm({
      clientName: "  Familia Ramírez  ",
      planId: "plan_01",
      eventDate: "2026-09-15",
      venue: "  Jardín Hidalgo  ",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        clientName: "Familia Ramírez",
        planId: "plan_01",
        eventDate: "2026-09-15",
        venue: "Jardín Hidalgo",
      });
    }
  });

  it.each([
    { label: "sin cliente", values: { clientName: "  ", planId: "plan_01", eventDate: "2026-09-15", venue: "Plaza" } },
    { label: "sin plan", values: { clientName: "Cliente", planId: "", eventDate: "2026-09-15", venue: "Plaza" } },
    { label: "sin lugar", values: { clientName: "Cliente", planId: "plan_01", eventDate: "2026-09-15", venue: " " } },
  ])("rechaza una presentación $label", ({ values }) => {
    const result = validatePresentationForm(values);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(PRESENTATION_FIELDS_MESSAGE);
    }
  });

  it.each([
    ["fecha imposible", "2026-02-30"],
    ["mes inválido", "2026-13-01"],
    ["formato invertido", "15-09-2026"],
    ["no es fecha", "mañana"],
    ["vacía", ""],
  ])("rechaza una $label", (_label, eventDate) => {
    const result = validatePresentationForm({
      clientName: "Cliente",
      planId: "plan_01",
      eventDate,
      venue: "Plaza",
    });

    expect(result).toEqual({ ok: false, error: INVALID_EVENT_DATE_MESSAGE });
  });
});

describe("presentacionesRepository", () => {
  it("siembra presentaciones demo y las lista por el mes actual", async () => {
    const ref = currentMonthRef();
    const presentations = await presentationsRepository.listPresentationsByMonth(
      monthKey(ref),
    );

    expect(presentations.length).toBeGreaterThanOrEqual(2);
    for (const presentation of presentations) {
      expect(presentation.eventDate.startsWith(monthKey(ref))).toBe(true);
    }
  });

  it("lista únicamente las presentaciones del mes solicitado", async () => {
    await presentationsRepository.createPresentation({
      planName: "Serenata Tradicional",
      clientName: "Test Cliente",
      venue: "Salón Prueba",
      eventDate: "1999-02-10",
    });

    const february = await presentationsRepository.listPresentationsByMonth("1999-02");
    const march = await presentationsRepository.listPresentationsByMonth("1999-03");

    expect(february).toHaveLength(1);
    expect(february[0].clientName).toBe("Test Cliente");
    expect(march).toEqual([]);
  });

  it("rechaza confirmar una presentación en una fecha ya ocupada", async () => {
    const input = {
      planName: "Mañanitas Especiales",
      clientName: "Segundo Cliente",
      venue: "Casa Test",
      eventDate: "1998-06-20",
    };

    const created = await presentationsRepository.createPresentation(input);
    expect(created.eventDate).toBe("1998-06-20");

    await expect(
      presentationsRepository.createPresentation({
        ...input,
        clientName: "Otro Cliente",
      }),
    ).rejects.toThrow(presentationsRepository.PresentationDateTakenError);
  });
});
