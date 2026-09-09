import { Music2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Plan } from "@/db/schema";
import { formatDuration, formatPeso } from "@/features/conocer-los-planes-musicales-ofrecidos/logic";

export interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
}

export function PlanCard({ plan, onSelect }: PlanCardProps) {
  return (
    <Card className="h-100 d-flex flex-column">
      <CardHeader>
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              <Badge tone="info">{formatDuration(plan.durationMinutes)}</Badge>
            </CardDescription>
          </div>
          <div
            className="d-flex align-items-center justify-content-center rounded bg-primary-subtle text-primary shrink-0"
            style={{ width: "2.5rem", height: "2.5rem" }}
          >
            <Music2 size={20} />
          </div>
        </div>
      </CardHeader>
      <CardBody className="d-flex flex-column">
        <p className="text-secondary small mb-3">{plan.description}</p>
        <div className="d-flex align-items-baseline justify-content-between mt-auto mb-3">
          <span className="small text-muted text-uppercase">Tarifa</span>
          <span className="fs-4 fw-bold text-primary">
            {plan.rate !== null ? formatPeso(plan.rate) : ""}
          </span>
        </div>
        <Button variant="outline" size="sm" className="w-100" onClick={() => onSelect(plan)}>
          Ver detalles
        </Button>
      </CardBody>
    </Card>
  );
}
