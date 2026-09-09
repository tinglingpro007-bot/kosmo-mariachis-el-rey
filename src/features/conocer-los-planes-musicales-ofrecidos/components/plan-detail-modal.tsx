"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Plan } from "@/db/schema";
import { formatDuration, formatPeso } from "@/features/conocer-los-planes-musicales-ofrecidos/logic";

export interface PlanDetailModalProps {
  plan: Plan | null;
  onClose: () => void;
}

export function PlanDetailModal({ plan, onClose }: PlanDetailModalProps) {
  return (
    <Modal
      isOpen={plan !== null}
      onClose={onClose}
      title={plan?.name ?? "Detalle del plan"}
      footer={
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {plan ? (
        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center gap-2">
            <Badge tone="info">{formatDuration(plan.durationMinutes)}</Badge>
          </div>
          <p className="text-secondary mb-0">{plan.description}</p>
          <div className="border rounded p-3 bg-light">
            <div className="small text-muted text-uppercase mb-1">Tarifa</div>
            <div className="fs-3 fw-bold text-primary">
              {plan.rate !== null ? formatPeso(plan.rate) : ""}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
