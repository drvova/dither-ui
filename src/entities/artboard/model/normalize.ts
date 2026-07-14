import { createChart, createSeriesRow } from "@/entities/chart"
import { createWidget } from "@/entities/widget"
import { CHART_TYPES, type ChartType } from "@/shared/config"
import type { Artboard } from "./types"

/**
 * Documents outlive the model: every saved project, preset, and import was
 * written by some older schema. Instead of nuking work with storage-key bumps,
 * fill anything missing from the current factory defaults — additive model
 * changes then never crash a render (`undefined.toFixed()` class of bug).
 */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

/** Copy missing keys from defaults; recurse into plain objects. Existing
 * values (including arrays) are never overwritten. */
function fill(target: Record<string, unknown>, defaults: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(defaults)) {
    if (v === undefined) continue
    const cur = target[k]
    if (cur === undefined) target[k] = JSON.parse(JSON.stringify(v))
    else if (isPlainObject(v) && isPlainObject(cur)) fill(cur, v)
  }
}

const validType = (t: unknown): ChartType =>
  CHART_TYPES.includes(t as ChartType) ? (t as ChartType) : "area"

/** Bring an artboard from any older schema up to the current one, in place. */
export function normalizeArtboard(a: Artboard): Artboard {
  // frame-level fields
  fill(a as unknown as Record<string, unknown>, {
    hidden: false,
    locked: false,
    groupId: null,
  })

  // chart (widget frames keep a stub chart too)
  if (!isPlainObject(a.chart)) a.chart = createChart("area")
  else {
    const defaults = createChart(validType((a.chart as { type?: unknown }).type))
    fill(a.chart as unknown as Record<string, unknown>, {
      ...defaults,
      // arrays fill only when missing entirely — never overwrite data
      rows: defaults.rows,
      series: defaults.series,
    })
    for (const s of a.chart.series) {
      fill(
        s as unknown as Record<string, unknown>,
        createSeriesRow(s.key ?? "series", s.label ?? "Series", "blue") as unknown as Record<string, unknown>
      )
    }
  }

  // widget models
  const w = a.widget
  if (isPlainObject(w)) {
    if (w.kind === "avatar" || w.kind === "button" || w.kind === "gradient" || w.kind === "image") {
      fill(
        w as unknown as Record<string, unknown>,
        createWidget(w.kind) as unknown as Record<string, unknown>
      )
    } else if (w.kind === "component") {
      fill(w as unknown as Record<string, unknown>, { props: {}, slotText: null })
    } else if (w.kind === "screen") {
      fill(w as unknown as Record<string, unknown>, { rows: [], gap: 16, padding: 20 })
    }
  }
  return a
}
