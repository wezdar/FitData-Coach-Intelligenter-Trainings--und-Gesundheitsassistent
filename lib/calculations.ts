export type BiologicalSex = "maennlich" | "weiblich";

export function calculateBmi(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) throw new Error("Werte müssen positiv sein");
  return weightKg / (heightCm / 100) ** 2;
}

export function healthyWeightRange(heightCm: number) {
  if (heightCm <= 0) throw new Error("Größe muss positiv sein");
  const squareMetres = (heightCm / 100) ** 2;
  return { min: 18.5 * squareMetres, max: 24.9 * squareMetres };
}

export function calculateBmr(weightKg: number, heightCm: number, age: number, sex: BiologicalSex) {
  const offset = sex === "maennlich" ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + offset;
}

export function calculateTdee(bmrKcal: number, activityFactor: number) {
  return bmrKcal * activityFactor;
}

export function estimateDistanceKm(steps: number, strideLengthCm = 74) {
  return (steps * strideLengthCm) / 100_000;
}

export function estimateExerciseCalories(met: number, weightKg: number, durationMinutes: number) {
  return (met * 3.5 * weightKg * durationMinutes) / 200;
}

export function adherenceRate(completed: number, planned: number) {
  if (planned <= 0) return 0;
  return Math.min(100, Math.max(0, (completed / planned) * 100));
}

/**
 * Documentation shown on the analytics page. Prose lives in the translation
 * dictionaries; only the units and field lineage are literal here because they
 * are technical identifiers.
 */
export const metricDocumentation = {
  bmi: {
    formulaKey: "m.bmiFormula", unit: "kg/m²",
    assumptionsKey: "m.bmiAssumptions", limitationsKey: "m.bmiLimits",
    lineage: ["analytics.latest_measurement.weight_kg", "profile.height_cm"],
  },
  distance: {
    formulaKey: "m.distFormula", unit: "km",
    assumptionsKey: "m.distAssumptions", limitationsKey: "m.distLimits",
    lineage: ["staging.activity.steps", "profile.stride_length_cm"],
  },
  calories: {
    formulaKey: "m.calFormulaExact", unit: "kcal",
    assumptionsKey: "m.calAssumptions", limitationsKey: "m.calLimits",
    lineage: ["staging.workout.met", "profile.weight_kg", "staging.workout.duration_min"],
  },
} as const;
