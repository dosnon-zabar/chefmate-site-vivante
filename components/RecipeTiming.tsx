/**
 * RecipeTiming — display component for a recipe step's timing OR for a
 * recipe's aggregate (computed via sumTimings from lib/timing).
 *
 * Two variants:
 *  - compact: inline one-line summary, for list rows and step previews.
 *    Shows only the total (with a J-1 icon if passive > 8h).
 *  - full: detailed breakdown card: active / passive / total, each line
 *    hidden when null. Used on recipe detail pages and the top of the
 *    step editor.
 *
 * This component is STATELESS. The parent is responsible for building
 * the Timing object (via stepToTiming / sumTimings). Same component
 * shape exists in admin and site-vivante — keep the three in sync.
 */

import {
  type Timing,
  activeDuration,
  passiveDuration,
  totalDuration,
  formatDuration,
  durationIsEmpty,
  timingIsEmpty,
  needsJ1Warning,
} from "@/lib/timing"

// Inline SVG icons — manager doesn't pull lucide, and these three
// shapes aren't worth a new dependency.
function IconClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  )
}

function IconTimer({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M10 3h4M12 14l3-3M5 14a7 7 0 1014 0 7 7 0 00-14 0z" />
    </svg>
  )
}

function IconFlame({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2s5 5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-5 .5 1 1.5 2 2.5 2 0-2-1-5 .5-7z"
      />
    </svg>
  )
}

function IconAlert({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
    </svg>
  )
}

type Variant = "compact" | "full"

interface Props {
  timing: Timing
  variant?: Variant
  /** Optional class overrides for the root element. */
  className?: string
}

export function RecipeTiming({ timing, variant = "full", className = "" }: Props) {
  if (timingIsEmpty(timing)) return null

  if (variant === "compact") {
    return <CompactTiming timing={timing} className={className} />
  }
  return <FullTiming timing={timing} className={className} />
}

function CompactTiming({ timing, className }: { timing: Timing; className: string }) {
  const total = formatDuration(totalDuration(timing))
  const warn = needsJ1Warning(timing)
  if (!total) return null
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-brun-light ${className}`}
      title={warn ? "Durée passive > 8h : planifier J-1" : undefined}
    >
      <IconClock className="w-3.5 h-3.5" />
      {total}
      {warn && (
        <span className="text-ocre inline-flex" aria-label="Planifier J-1">
          <IconAlert className="w-3.5 h-3.5" />
        </span>
      )}
    </span>
  )
}

function FullTiming({ timing, className }: { timing: Timing; className: string }) {
  const active = activeDuration(timing)
  const passive = passiveDuration(timing)
  const total = totalDuration(timing)
  const warn = needsJ1Warning(timing)

  const hasActive = !durationIsEmpty(active)
  const hasPassive = !durationIsEmpty(passive)
  const hasTotal = !durationIsEmpty(total)

  // Skip rendering entirely if nothing to show (defense; caller should
  // already have used timingIsEmpty).
  if (!hasActive && !hasPassive && !hasTotal && !timing.notes) return null

  return (
    <div
      className={`bg-white rounded-xl border border-brun/10 p-4 space-y-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-sm text-brun">Durées</h3>
        {warn && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-ocre bg-ocre-light/40 px-2 py-0.5 rounded-full"
            title="Plus de 8h de temps passif : à anticiper en J-1."
          >
            <IconAlert className="w-3 h-3" />
            Planifier J-1
          </span>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm text-brun">
        {hasActive && (
          <>
            <dt className="flex items-center gap-2 text-brun-light">
              <IconTimer className="w-4 h-4" />
              <span>Actif</span>
            </dt>
            <dd className="font-medium text-right tabular-nums">
              {formatDuration(active)}
            </dd>
          </>
        )}
        {hasPassive && (
          <>
            <dt className="flex items-center gap-2 text-brun-light">
              <IconFlame className="w-4 h-4" />
              <span>Passif</span>
            </dt>
            <dd className="text-right tabular-nums">{formatDuration(passive)}</dd>
          </>
        )}
        {hasTotal && hasActive && hasPassive && (
          <>
            <dt className="flex items-center gap-2 text-brun-light/80 text-xs pt-1 border-t border-brun/5">
              <IconClock className="w-3.5 h-3.5" />
              <span>Total</span>
            </dt>
            <dd className="text-right tabular-nums text-xs text-brun-light/80 pt-1 border-t border-brun/5">
              {formatDuration(total)}
            </dd>
          </>
        )}
      </dl>

      {timing.notes && (
        <p className="text-xs text-brun-light italic pt-1 border-t border-brun/5">
          {timing.notes}
        </p>
      )}
    </div>
  )
}
