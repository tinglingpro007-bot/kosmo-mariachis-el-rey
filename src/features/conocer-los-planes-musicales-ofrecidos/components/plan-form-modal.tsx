"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Plan } from "@/db/schema";
import {
  PLAN_DURATION_OPTIONS,
  formatDuration,
  validatePlanForm,
} from "@/features/conocer-los-planes-musicales-ofrecidos/logic";

export interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (plan: Plan) => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  rate?: string;
  durationMinutes?: string;
  submit?: string;
}

export function PlanFormModal({ isOpen, onClose, onCreated }: PlanFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
    setRate("");
    setDurationMinutes("60");
    setErrors({});
    setSaving(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const result = validatePlanForm({ name, description, rate, durationMinutes });
    if (!result.ok) {
      setErrors({ submit: result.error });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: Plan; detail?: string }
        | null;

      if (!response.ok || !payload?.data) {
        setErrors({ submit: payload?.detail ?? "No se pudo guardar el plan. Intenta de nuevo." });
        setSaving(false);
        return;
      }

      onCreated(payload.data);
      resetForm();
    } catch {
      setErrors({ submit: "No se pudo guardar el plan. Intenta de nuevo." });
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo plan musical"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        {errors.submit ? (
          <Alert variant="danger" className="mb-3">
            {errors.submit}
          </Alert>
        ) : null}

        <div className="mb-3">
          <Label htmlFor="plan-name">Nombre del plan</Label>
          <Input
            id="plan-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Serenata Tradicional"
            isInvalid={Boolean(errors.name)}
            autoComplete="off"
          />
        </div>

        <div className="mb-3">
          <Label htmlFor="plan-description">Descripción</Label>
          <Textarea
            id="plan-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe qué incluye el plan"
            isInvalid={Boolean(errors.description)}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <Label htmlFor="plan-rate">Tarifa (MXN)</Label>
            <Input
              id="plan-rate"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="Ej. 2500"
              isInvalid={Boolean(errors.rate)}
            />
          </div>
          <div className="col-12 col-md-6">
            <Label htmlFor="plan-duration">Duración</Label>
            <Select
              id="plan-duration"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              isInvalid={Boolean(errors.durationMinutes)}
            >
              {PLAN_DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatDuration(minutes)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
