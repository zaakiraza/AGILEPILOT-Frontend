// src/library/estimator.ts
export type EstTask = { optimistic: number; likely: number; pessimistic: number; hourlyRate?: number };

export function pertEstimateHours(tasks: EstTask[]): number {
  return tasks.reduce((sum, t) => {
    const e = (t.optimistic + 4 * t.likely + t.pessimistic) / 6;
    return sum + e;
  }, 0);
}

export function estimateCost(tasks: EstTask[], contingencyPercent = 10) {
  const hours = pertEstimateHours(tasks);
  const labor = tasks.reduce((s, t) => {
    const e = (t.optimistic + 4 * t.likely + t.pessimistic) / 6;
    return s + e * (t.hourlyRate ?? 0);
  }, 0);
  const contingency = (labor * contingencyPercent) / 100;
  return { hours, labor, contingency, total: labor + contingency };
}