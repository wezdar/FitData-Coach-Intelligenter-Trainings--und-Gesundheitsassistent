import { describe, expect, it } from "vitest";
import {
  adherenceRate, calculateBmi, calculateBmr, calculateTdee,
  estimateDistanceKm, estimateExerciseCalories, healthyWeightRange,
} from "@/lib/calculations";

describe("fitness calculations", () => {
  it("calculates BMI and the indicative range", () => {
    expect(calculateBmi(77.2, 180)).toBeCloseTo(23.83, 2);
    expect(healthyWeightRange(180).min).toBeCloseTo(59.94, 2);
  });

  it("calculates Mifflin–St Jeor BMR and TDEE", () => {
    const bmr = calculateBmr(77.2, 180, 32, "weiblich");
    expect(bmr).toBeCloseTo(1576, 0);
    expect(calculateTdee(bmr, 1.55)).toBeCloseTo(2442.8, 1);
  });

  it("estimates distance, calories, and adherence", () => {
    expect(estimateDistanceKm(6842, 74)).toBeCloseTo(5.063, 2);
    expect(estimateExerciseCalories(6, 77.2, 52)).toBeCloseTo(421.5, 1);
    expect(adherenceRate(4, 5)).toBe(80);
  });
});
