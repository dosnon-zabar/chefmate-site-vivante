/**
 * Recipe timing helpers — formatting and aggregation.
 *
 * Timings are stored on `recipe_steps` as three {min,max} pairs
 * (prep / cook / rest) plus a free-form `timing_notes` text. At render
 * time we aggregate the sum across steps to show a recipe-level total.
 *
 * This module is a pure-function boundary: no React, no DOM — identical
 * copies can live in admin, manager and site-vivante without coupling.
 */

export interface Duration {
  min: number | null
  max: number | null
}

export interface Timing {
  prep: Duration
  cook: Duration
  rest: Duration
  notes?: string | null
}

/**
 * Threshold above which passive time is flagged as "plan it J-1":
 * 8 hours of incompressible waiting typically means the step has to
 * start the day before.
 */
export const LONG_PASSIVE_THRESHOLD_MIN = 8 * 60

/**
 * Normalize an arbitrary value (number | numeric string | null | undefined
 * | "") to either a non-negative integer or null. Defensive for data that
 * comes back from the API with either shape. Does NOT enforce upper
 * bounds — that's the DB's job.
 */
export function normalizeMinutes(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.trunc(n)
}

/**
 * Extract a Timing shape from a raw step-like object. Accepts snake_case
 * column names (as returned by the API) and tolerates missing fields.
 */
export function stepToTiming(step: Record<string, unknown> | null | undefined): Timing {
  const s = step ?? {}
  return {
    prep: {
      min: normalizeMinutes(s["prep_minutes_min"]),
      max: normalizeMinutes(s["prep_minutes_max"]),
    },
    cook: {
      min: normalizeMinutes(s["cook_minutes_min"]),
      max: normalizeMinutes(s["cook_minutes_max"]),
    },
    rest: {
      min: normalizeMinutes(s["rest_minutes_min"]),
      max: normalizeMinutes(s["rest_minutes_max"]),
    },
    notes:
      typeof s["timing_notes"] === "string" && (s["timing_notes"] as string).trim()
        ? (s["timing_notes"] as string)
        : null,
  }
}

/** Sum two durations. Handles nulls: a null + x = x. Sum of two nulls = null. */
function addDurations(a: Duration, b: Duration): Duration {
  const min =
    a.min === null && b.min === null
      ? null
      : (a.min ?? 0) + (b.min ?? 0)
  const max =
    a.max === null && b.max === null
      ? null
      : (a.max ?? 0) + (b.max ?? 0)
  return { min, max }
}

/**
 * Cumulate an array of step-level timings into a recipe-level timing.
 * Notes from individual steps are deliberately dropped — the aggregate
 * display doesn't concatenate free text. Callers that want notes
 * can read them off the original steps.
 */
export function sumTimings(timings: Timing[]): Timing {
  const zero: Timing = {
    prep: { min: null, max: null },
    cook: { min: null, max: null },
    rest: { min: null, max: null },
  }
  return timings.reduce<Timing>((acc, t) => ({
    prep: addDurations(acc.prep, t.prep),
    cook: addDurations(acc.cook, t.cook),
    rest: addDurations(acc.rest, t.rest),
  }), zero)
}

/** Active (hands-on) time = prep. */
export function activeDuration(t: Timing): Duration {
  return t.prep
}

/** Passive (incompressible) time = cook + rest. */
export function passiveDuration(t: Timing): Duration {
  return addDurations(t.cook, t.rest)
}

/** Total time = prep + cook + rest. */
export function totalDuration(t: Timing): Duration {
  return addDurations(t.prep, addDurations(t.cook, t.rest))
}

/**
 * Format a number of minutes per the spec:
 *  - < 60      → "45 min"
 *  - multiple  → "2h"
 *  - otherwise → "1h30"
 *
 * Zero is formatted as "0 min" for callers who want to explicitly show
 * a zero value; most UIs skip the row entirely when both min and max
 * are null — use durationIsEmpty() to decide.
 */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.trunc(minutes))
  if (m < 60) return `${m} min`
  const hours = Math.floor(m / 60)
  const rem = m % 60
  if (rem === 0) return `${hours}h`
  // Pad single-digit remainders to match the spec example "1h30" /
  // "2h15". For "2h05" we keep two digits; for "2h30" no pad needed —
  // a 2-digit remainder always displays as-is.
  return `${hours}h${String(rem).padStart(2, "0")}`
}

/**
 * Format a Duration, returning:
 *  - ""       if both min and max are null
 *  - "X"      if they're equal (or one is null)
 *  - "X – Y"  if they differ (em-dash between)
 */
export function formatDuration(d: Duration): string {
  const hasMin = d.min !== null && d.min > 0
  const hasMax = d.max !== null && d.max > 0
  // If neither provided, nothing to say.
  if (!hasMin && !hasMax) {
    // Handle the "0 min" case explicitly — zero is a valid value.
    if (d.min === 0 && d.max === 0) return formatMinutes(0)
    if (d.min !== null && d.max !== null && d.min === 0 && d.max === 0) {
      return formatMinutes(0)
    }
    return ""
  }
  const lo = d.min !== null ? d.min : d.max!
  const hi = d.max !== null ? d.max : d.min!
  if (lo === hi) return formatMinutes(lo)
  return `${formatMinutes(lo)} \u2013 ${formatMinutes(hi)}`
}

/** Is this duration effectively empty (nothing to display)? */
export function durationIsEmpty(d: Duration): boolean {
  return (d.min === null || d.min === 0) && (d.max === null || d.max === 0)
}

/** Is the full timing effectively empty (all three durations + no notes)? */
export function timingIsEmpty(t: Timing): boolean {
  return (
    durationIsEmpty(t.prep) &&
    durationIsEmpty(t.cook) &&
    durationIsEmpty(t.rest) &&
    !t.notes
  )
}

/**
 * Does this timing's PASSIVE duration warrant a J-1 planning warning?
 * Triggered by the upper bound of (cook + rest) exceeding 8 hours.
 */
export function needsJ1Warning(t: Timing): boolean {
  const passive = passiveDuration(t)
  const threshold = LONG_PASSIVE_THRESHOLD_MIN
  if (passive.max !== null && passive.max > threshold) return true
  if (passive.min !== null && passive.min > threshold) return true
  return false
}
