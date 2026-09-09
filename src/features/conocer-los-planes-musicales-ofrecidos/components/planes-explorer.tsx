"use client";

import { useState } from "react";
import { ListMusic, Music, Plus, RotateCcw, Trash2 } from "lucide-react";

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
import { Tabs } from "@/components/ui/tabs";
import type { Plan } from "@/db/schema";
import {
  NO_PLANS_FOR_DURATION_MESSAGE,
  durationOptions,
  filterPlansByDuration,
  formatDuration,
  formatPeso,
  planWithoutRateAlerts,
  visiblePlansForCustomer,
} from "@/features/conocer-los-planes-musicales-ofrecidos/logic";
import { PlanCard } from "@/features/conocer-los-planes-musicales-ofrecidos/components/plan-card";
import { PlanDetailModal } from "@/features/conocer-los-planes-musicales-ofrecidos/components/plan-detail-modal";
import { PlanFormModal } from "@/features/conocer-los-planes-musicales-ofrecidos/components/plan-form-modal";

type Role = "cliente" | "admin";
type DurationFilter = number | "all";
type Notice = { tone: "success" | "danger"; text: string } | null;

export interface PlanesExplorerProps {
  initialPlans: Plan[];
}

export function PlanesExplorer({ initialPlans }: PlanesExplorerProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [role, setRole] = useState<Role>("cliente");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [detailPlan, setDetailPlan] = useState<Plan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const visiblePlans = visiblePlansForCustomer(plans);
  const allDurations = durationOptions(plans);
  const filteredPlans = filterPlansByDuration(
    visiblePlans,
    durationFilter === "all" ? null : durationFilter,
  );
  const missingRateAlerts = planWithoutRateAlerts(plans);
  const hasActiveFilter = durationFilter !== "all";

  async function refreshPlans(): Promise<boolean> {
    try {
      const response = await fetch("/api/plans");
      const payload = (await response.json()) as { data?: Plan[] };
      if (!response.ok || !payload.data) return false;
      setPlans(payload.data);
      return true;
    } catch {
      return false;
    }
  }

  async function handleRefresh() {
    const ok = await refreshPlans();
    setNotice(ok ? { tone: "success", text: "La lista de planes se actualizó correctamente." } : { tone: "danger", text: "No se pudo actualizar la lista de planes." });
  }

  function handleCreated(plan: Plan) {
    setPlans((current) => [plan, ...current]);
    setFormOpen(false);
    setNotice({ tone: "success", text: `El plan "${plan.name}" se registró correctamente.` });
  }

  async function handleDelete(plan: Plan) {
    try {
      const response = await fetch(`/api/plans/${plan.id}`, { method: "DELETE" });
      if (!response.ok) {
        setNotice({ tone: "danger", text: "No se pudo eliminar el plan. Intenta de nuevo." });
        return;
      }
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      setNotice({ tone: "success", text: `El plan "${plan.name}" se eliminó correctamente.` });
    } catch {
      setNotice({ tone: "danger", text: "No se pudo eliminar el plan. Intenta de nuevo." });
    }
  }

  function handleSelectDetail(plan: Plan) {
    if (plan.rate !== null) setDetailPlan(plan);
  }

  return (
    <div className="d-flex flex-column gap-3">
      <Tabs
        variant="pills"
        items={[
          { id: "cliente", label: "Cliente", icon: <Music size={16} /> },
          { id: "admin", label: "Administrador", icon: <ListMusic size={16} /> },
        ]}
        activeId={role}
        onChange={(id) => setRole(id as Role)}
      />

      {notice ? (
        <Alert variant={notice.tone} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      ) : null}

      {role === "cliente" ? (
        <section className="d-flex flex-column gap-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              {allDurations.length > 0 ? (
                <Select
                  aria-label="Filtrar por duración"
                  className="w-auto"
                  value={durationFilter === "all" ? "all" : String(durationFilter)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDurationFilter(value === "all" ? "all" : Number(value));
                  }}
                >
                  <option value="all">Todas las duraciones</option>
                  {allDurations.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDuration(minutes)}
                    </option>
                  ))}
                </Select>
              ) : null}
              <span className="text-muted small">
                {visiblePlans.length} {visiblePlans.length === 1 ? "plan disponible" : "planes disponibles"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCcw size={14} />
              Actualizar
            </Button>
          </div>

          {filteredPlans.length === 0 ? (
            hasActiveFilter ? (
              <EmptyState
                icon={Music}
                title={NO_PLANS_FOR_DURATION_MESSAGE}
                description="Prueba con otra duración o revisa todos los planes disponibles."
              />
            ) : (
              <EmptyState
                icon={Music}
                title="Aún no hay planes disponibles"
                description="Los planes musicales con tarifa definida aparecerán aquí."
              />
            )
          ) : (
            <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-3">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="col">
                  <PlanCard plan={plan} onSelect={handleSelectDetail} />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="d-flex flex-column gap-3">
          {missingRateAlerts.length > 0 ? (
            <Alert variant="warning" title="Atención: planes sin tarifa definida">
              <ul className="mb-0">
                {missingRateAlerts.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert>
          ) : null}

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <div className="fw-semibold text-dark">Gestión del catálogo</div>
              <div className="small text-muted">
                Solo los planes con tarifa definida son visibles para los clientes.
              </div>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={16} />
              Nuevo plan
            </Button>
          </div>

          {plans.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title="No hay planes registrados"
              description="Registra el primer plan musical del grupo."
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus size={14} />
                  Nuevo plan
                </Button>
              }
            />
          ) : (
            <div className="row g-3 row-cols-1 row-cols-md-2 row-cols-xl-3">
              {plans.map((plan) => (
                <div key={plan.id} className="col">
                  <Card className="h-100 d-flex flex-column">
                    <CardHeader>
                      <CardTitle className="d-flex align-items-center justify-content-between gap-2">
                        {plan.name}
                        <Badge tone="info">{formatDuration(plan.durationMinutes)}</Badge>
                      </CardTitle>
                      <CardDescription>{plan.id.slice(0, 8)}</CardDescription>
                    </CardHeader>
                    <CardBody className="d-flex flex-column">
                      <p className="text-secondary small mb-3">{plan.description}</p>
                      <div className="d-flex align-items-center justify-content-between gap-2 mt-auto">
                        {plan.rate !== null ? (
                          <span className="fs-5 fw-bold text-primary">
                            {formatPeso(plan.rate)}
                          </span>
                        ) : (
                          <Badge tone="danger">Sin tarifa (oculto a clientes)</Badge>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(plan)}
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <PlanDetailModal plan={detailPlan} onClose={() => setDetailPlan(null)} />
      <PlanFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
