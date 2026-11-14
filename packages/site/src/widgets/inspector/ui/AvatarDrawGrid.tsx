import { createMemo, Index } from "solid-js"
import type { AvatarModel } from "@/entities/widget"
import { clampGrid, cssColor, seededPattern } from "@dither-ui/kit"

export type AvatarDrawGridProps = { avatar: AvatarModel }

const KEY =
  "rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"

/** Click/drag pixel editor for drawn avatars. Symmetry follows the model's
 * mirror setting (horizontal folds left/right, vertical top/bottom, auto =
 * free painting). */
export default function AvatarDrawGrid(props: AvatarDrawGridProps) {
  const grid = createMemo(() => clampGrid(props.avatar.grid))
  const cells = createMemo(() => {
    const n = grid() * grid()
    const on = props.avatar.pattern?.on ?? []
    return Array.from({ length: n }, (_, i) => !!on[i])
  })
  const fill = createMemo(() => (props.avatar.autoColor ? "var(--color-foreground)" : cssColor(props.avatar.color)))

  function ensurePattern() {
    const model = props.avatar
    const n = grid() * grid()
    if (!model.pattern || model.pattern.on.length !== n) {
      // Seed the canvas-to-be from the current generative pattern so switching
      // to draw starts from something recognisable instead of a blank grid.
      const seeded = seededPattern(model.name, grid(), model.mirror)
      model.pattern = {
        on: seeded.on.map((b) => (b ? 1 : 0)),
        density: seeded.density.map((d) => Math.round(d * 100) / 100),
      }
    }
  }

  const twinOf = (i: number): number | null => {
    const g = grid()
    const r = Math.floor(i / g)
    const c = i % g
    if (props.avatar.mirror === "horizontal") return r * g + (g - 1 - c)
    if (props.avatar.mirror === "vertical") return (g - 1 - r) * g + c
    return null
  }

  let paintTo: 0 | 1 = 1
  function setCell(i: number, value: 0 | 1) {
    ensurePattern()
    const p = props.avatar.pattern!
    p.on[i] = value
    p.density[i] = p.density[i] || 0.85
    const twin = twinOf(i)
    if (twin != null && twin !== i) {
      p.on[twin] = value
      p.density[twin] = p.density[twin] || 0.85
    }
  }
  function onDown(i: number, e: PointerEvent) {
    e.preventDefault()
    ensurePattern()
    paintTo = props.avatar.pattern!.on[i] ? 0 : 1
    setCell(i, paintTo)
  }
  function onEnter(i: number, e: PointerEvent) {
    if (e.buttons === 1) setCell(i, paintTo)
  }

  function fillAll(value: 0 | 1) {
    ensurePattern()
    const p = props.avatar.pattern!
    p.on = p.on.map(() => value)
  }
  function invert() {
    ensurePattern()
    const p = props.avatar.pattern!
    p.on = p.on.map((v) => (v ? 0 : 1))
  }
  function reseed() {
    props.avatar.pattern = null
    ensurePattern()
  }

  return (
    <div class="flex flex-col gap-2">
      <div
        class="grid aspect-square w-full touch-none select-none gap-px rounded-md bg-border/60 p-px ring-1 ring-border"
        style={{ "grid-template-columns": `repeat(${grid()}, 1fr)` }}
      >
        <Index each={cells()}>
          {(onCell, i) => (
            <button
              type="button"
              class="aspect-square rounded-[1px] transition-colors"
              style={{ "background-color": onCell() ? fill() : "var(--color-background)" }}
              aria-label={`Cell ${i + 1}`}
              on:pointerdown={(e) => onDown(i, e)}
              on:pointerenter={(e) => onEnter(i, e)}
            />
          )}
        </Index>
      </div>
      <div class="flex flex-wrap gap-1">
        <button type="button" class={KEY} onClick={() => fillAll(0)}>
          clear
        </button>
        <button type="button" class={KEY} onClick={() => fillAll(1)}>
          fill
        </button>
        <button type="button" class={KEY} onClick={() => invert()}>
          invert
        </button>
        <button type="button" class={KEY} onClick={() => reseed()}>
          from seed
        </button>
      </div>
      <p class="text-[10px] leading-relaxed text-muted-foreground">
        Click or drag to paint. The mirror setting paints symmetrically.
      </p>
    </div>
  )
}
