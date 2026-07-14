import { type ComponentEntry, defaultComponentProps } from "./registry"

/** One component instance inside a screen row. */
export type ScreenCell = {
  id: string
  is: string
  props: Record<string, unknown>
  slotText: string | null
  model: unknown
  grow: boolean // flex-1 vs natural width
}

export type RowAlign = "start" | "center" | "end" | "stretch"
export type RowJustify = "start" | "center" | "end" | "between"

export type ScreenRow = {
  id: string
  cells: ScreenCell[]
  align: RowAlign
  justify: RowJustify
  gap: number
}

/**
 * A composed screen: a vertical stack of rows, each row a horizontal run of
 * registry components. One nesting level by design — rows of cells cover
 * real mockups; nested containers are a later, deliberate extension.
 */
export type ScreenModel = {
  kind: "screen"
  rows: ScreenRow[]
  gap: number // vertical gap between rows
  padding: number
}

let counter = 0
const uid = (p: string) => `${p}${Date.now().toString(36)}${(counter++).toString(36)}`

export function createCell(entry: ComponentEntry): ScreenCell {
  return {
    id: uid("c"),
    is: entry.is,
    props: defaultComponentProps(entry),
    slotText: entry.slotText ?? null,
    model: entry.vmodel ? entry.vmodel.def : undefined,
    grow: false,
  }
}

export function createRow(cells: ScreenCell[] = []): ScreenRow {
  return { id: uid("r"), cells, align: "center", justify: "start", gap: 12 }
}

export function createScreen(): ScreenModel {
  return { kind: "screen", rows: [createRow()], gap: 16, padding: 20 }
}

export function addScreenRow(screen: ScreenModel): ScreenRow {
  const row = createRow()
  screen.rows.push(row)
  return row
}

export function removeScreenRow(screen: ScreenModel, rowId: string): void {
  screen.rows = screen.rows.filter((r) => r.id !== rowId)
}

export function moveScreenRow(screen: ScreenModel, rowId: string, dir: -1 | 1): void {
  const i = screen.rows.findIndex((r) => r.id === rowId)
  const j = i + dir
  if (i < 0 || j < 0 || j >= screen.rows.length) return
  const [row] = screen.rows.splice(i, 1)
  screen.rows.splice(j, 0, row)
}

export function addCell(row: ScreenRow, entry: ComponentEntry): ScreenCell {
  const cell = createCell(entry)
  row.cells.push(cell)
  return cell
}

export function removeCell(screen: ScreenModel, cellId: string): void {
  for (const row of screen.rows) {
    const i = row.cells.findIndex((c) => c.id === cellId)
    if (i >= 0) {
      row.cells.splice(i, 1)
      return
    }
  }
}

export function moveCell(row: ScreenRow, cellId: string, dir: -1 | 1): void {
  const i = row.cells.findIndex((c) => c.id === cellId)
  const j = i + dir
  if (i < 0 || j < 0 || j >= row.cells.length) return
  const [cell] = row.cells.splice(i, 1)
  row.cells.splice(j, 0, cell)
}

export function findRow(screen: ScreenModel, rowId: string): ScreenRow | undefined {
  return screen.rows.find((r) => r.id === rowId)
}

export function findCell(
  screen: ScreenModel,
  cellId: string
): { row: ScreenRow; cell: ScreenCell } | undefined {
  for (const row of screen.rows) {
    const cell = row.cells.find((c) => c.id === cellId)
    if (cell) return { row, cell }
  }
  return undefined
}
