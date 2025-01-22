export function updateMetric(currentValue: number, minBound: number, maxBound: number, fluctRange: number): number {
  const delta = Math.random() * fluctRange - fluctRange / 2
  let newVal = currentValue + delta
  newVal = Math.min(Math.max(newVal, minBound), maxBound)
  return newVal
}

export function getMotionData(): Record<string, boolean> {
  return {
    A: Math.random() > 0.7,
    B: Math.random() > 0.7,
    C: Math.random() > 0.7,
  }
}

export function invokeLockdown({ sector }: { sector: string }): boolean {
  // Simulating a lockdown attempt with 80% success rate
  return Math.random() > 0.2
}

