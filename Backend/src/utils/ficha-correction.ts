import { toMinutes } from "./validation.js";

export type FichaEditableFields = {
  startTime: string;
  endTime?: string;
  description?: string;
  projectCode?: string;
  hoursWorked?: number;
};

export type FichaCorrectionChanges = {
  startTime?: string;
  endTime?: string;
  description?: string;
  projectCode?: string;
};

export function buildFichaCorrectionChanges(
  current: FichaEditableFields,
  proposed: FichaCorrectionChanges,
): FichaCorrectionChanges {
  const changes: FichaCorrectionChanges = {};

  if (
    proposed.startTime !== undefined &&
    proposed.startTime !== current.startTime
  ) {
    changes.startTime = proposed.startTime;
  }

  if (proposed.endTime !== undefined && proposed.endTime !== current.endTime) {
    changes.endTime = proposed.endTime;
  }

  if (
    proposed.description !== undefined &&
    proposed.description !== current.description
  ) {
    changes.description = proposed.description;
  }

  if (
    proposed.projectCode !== undefined &&
    proposed.projectCode !== current.projectCode
  ) {
    changes.projectCode = proposed.projectCode;
  }

  const candidateStart = changes.startTime ?? current.startTime;
  const candidateEnd = changes.endTime ?? current.endTime;

  if (candidateEnd && toMinutes(candidateEnd) < toMinutes(candidateStart)) {
    throw new Error(
      "La hora de fin propuesta no puede ser menor que la hora de inicio.",
    );
  }

  if (Object.keys(changes).length === 0) {
    throw new Error(
      "La solicitud no introduce cambios reales sobre la ficha actual.",
    );
  }

  return changes;
}

export function applyFichaCorrection(
  current: FichaEditableFields,
  changes: FichaCorrectionChanges,
): FichaEditableFields {
  const nextStartTime = changes.startTime ?? current.startTime;
  const nextEndTime =
    changes.endTime !== undefined ? changes.endTime : current.endTime;

  if (nextEndTime && toMinutes(nextEndTime) < toMinutes(nextStartTime)) {
    throw new Error(
      "La ficha corregida queda con una hora de fin anterior a la de inicio.",
    );
  }

  const hoursWorked = nextEndTime
    ? parseFloat(
        ((toMinutes(nextEndTime) - toMinutes(nextStartTime)) / 60).toFixed(2),
      )
    : undefined;

  return {
    startTime: nextStartTime,
    endTime: nextEndTime,
    description:
      changes.description !== undefined
        ? changes.description
        : current.description,
    projectCode:
      changes.projectCode !== undefined
        ? changes.projectCode
        : current.projectCode,
    hoursWorked,
  };
}
