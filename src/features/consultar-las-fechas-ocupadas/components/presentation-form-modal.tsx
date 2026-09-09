"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { Plan, Presentacion } from "@/db/schema";
import { validatePresentationForm } from "@/features/consultar-las-fechas-ocupadas/logic";

export interface PresentationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: Plan[];
  onCreated: (presentation: Presentacion) => void;
}

interface FormErrors {
  submit?: string;
}

export function PresentationFormModal({
  isOpen,
  onClose,
  plans,
  onCreated,
}: PresentationFormModalProps) {
  const [clientName, setClientName] = useState("");
  const [planId, setPlanId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setClientName("");
    setPlanId(plans[0]?.id ?? "");
    setEventDate("");
    setVenue("");
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

    const validation = validatePresentationForm({ clientName, planId, eventDate, venue });
    if (!validation.ok) {
      setErrors({ submit: validation.error });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/presentaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: Presentacion; detail?: string }
        | null;

      if (!response.ok || !payload?.data) {
        setErrors({
          submit:
            payload?.detail ??
            "No se pudo confirmar la presentación. Intente de nuevo.",
        });
        setSaving(false);
        return;
      }

      onCreated(payload.data);
      resetForm();
    } catch {
      setErrors({ submit: "No se pudo confirmar la presentación. Intente de nuevo." });
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar presentación confirmada"
      size="lg"
    >
      <form onSubmit={handleSubmit} noValidate>
        {errors.submit ? (
          <Alert variant="danger" className="mb-3">
            {errors.submit}
          </Alert>
        ) : null}

        <div className="mb-3">
          <Label htmlFor="presentation-client">Nombre del cliente</Label>
          <Input
            id="presentation-client"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Ej. Familia Ramírez"
            autoComplete="off"
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <Label htmlFor="presentation-plan">Plan contratado</Label>
            <Select
              id="presentation-plan"
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
            >
              {plans.length === 0 ? (
                <option value="">No hay planes registrados</option>
              ) : (
                plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))
              )}
            </Select>
          </div>
          <div className="col-12 col-md-6">
            <Label htmlFor="presentation-date">Fecha del evento</Label>
            <Input
              id="presentation-date"
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <Label htmlFor="presentation-venue">Lugar del evento</Label>
          <Input
            id="presentation-venue"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Ej. Jardín Hidalgo, Morelia"
            autoComplete="off"
          />
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Confirmar presentación"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
