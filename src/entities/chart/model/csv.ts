import { COLORS, familyOf } from "@/shared/config"
import { LABEL_KEY } from "./data"
import { createSeriesRow } from "./rows"
import type { ChartModel, DataRow } from "./types"

/** Minimal CSV line splitter — handles double-quoted fields with commas. */
function splitLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else quoted = !quoted
    } else if (ch === "," && !quoted) {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

const keyOf = (header: string, i: number): string => {
  const k = header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  return k || `col${i}`
}

export type ParsedCsv = { headers: string[]; records: string[][] }

/** Parse CSV text: first row = headers, first column = labels. */
export function parseCsv(text: string): ParsedCsv | null {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length)
  if (lines.length < 2) return null
  const headers = splitLine(lines[0])
  if (headers.length < 2) return null
  const records = lines.slice(1).map(splitLine)
  return { headers, records }
}

/**
 * Replace a chart's data with parsed CSV. Column 1 becomes the family's label
 * field; the remaining columns become series (pie takes only the first value
 * column — a slice per row). Existing series settings are kept when the key
 * matches; new keys get palette-rotated defaults.
 */
export function importCsv(chart: ChartModel, text: string): boolean {
  const parsed = parseCsv(text)
  if (!parsed) return false
  const fam = familyOf(chart.type)
  const labelKey = LABEL_KEY[fam]

  if (fam === "pie") {
    const rows: DataRow[] = []
    const seen = new Set<string>()
    for (const rec of parsed.records) {
      let name = keyOf(rec[0] ?? "", rows.length)
      while (seen.has(name)) name = `${name}_`
      seen.add(name)
      rows.push({ name, value: Number(rec[1]) || 0 })
    }
    if (!rows.length) return false
    chart.rows = rows
    chart.series = rows.map((r, i) => {
      const key = r.name as string
      const existing = chart.series.find((s) => s.key === key)
      return existing ?? createSeriesRow(key, key, COLORS[i % COLORS.length])
    })
    return true
  }

  const seriesKeys = parsed.headers.slice(1).map((h, i) => ({
    key: keyOf(h, i + 1),
    label: h || `Series ${i + 1}`,
  }))
  if (!seriesKeys.length) return false
  const rows: DataRow[] = parsed.records.map((rec, ri) => {
    const row: DataRow = { [labelKey]: rec[0] || `Row ${ri + 1}` }
    seriesKeys.forEach((s, i) => {
      row[s.key] = Number(rec[i + 1]) || 0
    })
    return row
  })
  if (!rows.length) return false
  chart.rows = rows
  chart.series = seriesKeys.map((s, i) => {
    const existing = chart.series.find((x) => x.key === s.key)
    if (existing) {
      existing.label = s.label
      return existing
    }
    return createSeriesRow(s.key, s.label, COLORS[i % COLORS.length])
  })
  return true
}
