"use client";

import { useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import type { Plan, Presentacion } from "@/db/schema";
import {
  CALENDAR_LOAD_ERROR_MESSAGE,
  PRESENTATION_CREATED_MESSAGE,
  WEEKDAY_LABELS,
  addMonths,
  buildCalendarGrid,
  compareMonths,
  currentMonthRef,
  dateKey,
  formatEventDateLabel,
  monthKey,
  monthLabel,
  monthOptionsAround,
  monthPresentationsByDate,
  parseMonthKey,
  presentationsOnDate,
  presentationTooltip,
} from "@/features/consultar-las-fechas-ocupadas/logic";
import { PresentationFormModal } from "@/features/consultar-las-fechas-ocupadas/components/presentation-form-modal";

const MONTH_NAV_SPAN = 12;

type Notice = { tone: "success" | "danger"; text: string } | null;

export interface PresentationCalendarProps {
  initialMonth: { year: number; month: number };
  initialPresentations: Presentacion[];
  initialPlans: Plan[];
}

export function PresentationCalendar({
  initialMonth,
  initialPresentations,
  initialPlans,
}: PresentationCalendarProps) {
  const [month, setMonth] = useState(initialMonth);
  const [presentations, setPresentations] = useState(initialPresentations);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [formOpen, setFormOpen] = useState(false);

  const today = currentMonthRef();
  const months = monthOptionsAround(today, MONTH_NAV_SPAN);
  const grid = buildCalendarGrid(month);
  const byDate = monthPresentationsByDate(presentations);
  const occupiedCount = byDate.size;
  const firstOption = parseMonthKey(months[0]?.value);
  const lastOption = parseMonthKey(months[months.length - 1]?.value);

  async function loadMonth(ref: { year: number; month: number }): Promise<boolean> {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/presentaciones?month=${monthKey(ref)}`);
      const payload = (await response.json()) as { data?: Presentacion[] };
      if (!response.ok || !payload.data) return false;
      setMonth(ref);
      setPresentations(payload.data);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleMonthChange(ref: { year: number; month: number }) {
    if (compareMonths(ref, month) === 0) return;
    const ok = await loadMonth(ref);
    if (!ok) {
      setLoadError(CALENDAR_LOAD_ERROR_MESSAGE);
    }
  }

  async function handleRefresh() {
    const ok = await loadMonth(month);
    if (!ok) {
      setLoadError(CALENDAR_LOAD_ERROR_MESSAGE);
      return;
    }
    setNotice({ tone: "success", text: "El calendario se actualizó correctamente." });
  }

  function handleCreated(_presentation: Presentacion) {
    setFormOpen(false);
    setNotice({ tone: "success", text: PRESENTATION_CREATED_MESSAGE });
    void loadMonth(month);
  }

  const canGoPrev = firstOption ? compareMonths(addMonths(month, -1), firstOption) >= 0 : false;
  const canGoNext = lastOption ? compareMonths(addMonths(month, 1), lastOption) <= 0 : false;

  return (
    <div className="d-flex flex-column gap-4">
      {notice ? (
        <Alert variant={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      ) : null}
      {loadError ? (
        <Alert variant="danger" onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
      ) : null}

      <section className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Mes anterior"
            disabled={!canGoPrev || loading}
            onClick={() => void handleMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <h2 className="h4 fw-bold text-dark mb-0 text-nowrap">{monthLabel(month)}</h2>
          <Button
            variant="outline"
            size="sm"
            aria-label="Mes siguiente"
            disabled={!canGoNext || loading}
            onClick={() => void handleMonthChange(addMonths(month, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <Select
            aria-label="Seleccionar período"
            className="w-auto"
            value={monthKey(month)}
            onChange={(event) => {
              const ref = parseMonthKey(event.target.value);
              if (ref) void handleMonthChange(ref);
            }}
            disabled={loading}
          >
            {months.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={loading}>
            <RotateCcw size={14} />
            Actualizar
          </Button>
          <Button onClick={() => setFormOpen(true)} disabled={initialPlans.length === 0}>
            <Plus size={16} />
            Registrar presentación confirmada
          </Button>
        </div>
      </section>

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary small">
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          Cargando presentaciones del mes…
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="d-flex align-items-center justify-content-between gap-2">
            <span className="d-flex align-items-center gap-2">
              <CalendarDays size={18} />
              {monthLabel(month)}
            </span>
            <Badge tone={occupiedCount > 0 ? "success" : "neutral"}>
              {occupiedCount} {occupiedCount === 1 ? "fecha ocupada" : "fechas ocupadas"}
            </Badge>
          </CardTitle>
          <CardDescription className="d-flex flex-wrap align-items-center gap-3 pt-1">
            <span className="d-inline-flex align-items-center gap-1">
              <span className="rounded-1 d-inline-block border border-success-subtle bg-success-subtle" style={{ width: "0.85rem", height: "0.85rem" }} />
              Fecha ocupada
            </span>
            <span className="d-inline-flex align-items-center gap-1">
              <span className="rounded-1 d-inline-block border border-light bg-white" style={{ width: "0.85rem", height: "0.85rem" }} />
              Fecha libre
            </span>
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="d-flex flex-column gap-1">
            <div className="row g-1 text-center small fw-semibold text-secondary">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="col py-1">
                  {label}
                </div>
              ))}
            </div>
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="row g-1">
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return <div key={dayIndex} className="col" />;
                  }
                  const date = dateKey(month, day);
                  const dayPresentations = presentationsOnDate(byDate, date);
                  const occupied = dayPresentations.length > 0;
                  const first = dayPresentations[0];
                  return (
                    <div key={date} className="col">
                      <div
                        className={
                          occupied
                            ? "rounded-3 border border-success-subtle bg-success-subtle text-center px-1 py-2 h-100"
                            : "rounded-3 border border-light bg-white text-center px-1 py-2 h-100"
                        }
                        title={occupied && first ? presentationTooltip(first) : undefined}
                      >
                        <div
                          className={
                            occupied ? "fw-bold text-success-emphasis" : "fw-semibold text-secondary"
                          }
                        >
                          {day}
                        </div>
                        {occupied && first ? (
                          <div className="small text-success-emphasis text-truncate d-none d-md-block">
                            {first.clientName}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <section className="d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-2">
          <h3 className="h5 fw-semibold text-dark mb-0">Presentaciones confirmadas</h3>
          <Badge tone="info">{presentations.length}</Badge>
        </div>

        {presentations.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No hay presentaciones confirmadas en este mes"
            description={`El mes de ${monthLabel(month).toLowerCase()} no registra fechas ocupadas. Las fechas del calendario están libres.`}
          />
        ) : (
          <div className="row g-3 row-cols-1 row-cols-md-2 row-cols-xl-3">
            {presentations.map((presentation) => (
              <div key={presentation.id} className="col">
                <Card className="h-100">
                  <CardHeader>
                    <CardTitle className="d-flex align-items-center justify-content-between gap-2">
                      <span className="text-truncate">{presentation.clientName}</span>
                      <CalendarCheck size={18} className="text-success shrink-0" />
                    </CardTitle>
                    <CardDescription>{formatEventDateLabel(presentation.eventDate)}</CardDescription>
                  </CardHeader>
                  <CardBody>
                    <div className="d-flex flex-column gap-2 small text-secondary">
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={15} className="shrink-0" />
                        <span>{presentation.venue}</span>
                      </div>
                      <Badge tone="primary" className="align-self-start">
                        {presentation.planName}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      <PresentationFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        plans={initialPlans}
        onCreated={handleCreated}
      />
    </div>
  );
}
