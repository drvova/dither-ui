import { createMemo, For, Index, type JSX, splitProps } from "solid-js"
import type { BezierPoints } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { followPointer } from "@/shared/lib/follow"

type Own = { modelValue: BezierPoints; class?: string; onUpdateModelValue?: (value: BezierPoints) => void }
export type BezierEditorProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

// Screen space: x 0..1 spans the width; y -0.5..1.5 so overshoot is visible.
const W = 232
const H = 148
const Y_MIN = -0.5
const Y_MAX = 1.5
const sx = (x: number) => x * W
const sy = (y: number) => ((Y_MAX - y) / (Y_MAX - Y_MIN)) * H
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

// Animator staples — overshoot, anticipation, hard snap.
const PRESETS: { name: string; pts: BezierPoints }[] = [
  { name: "back", pts: [0.34, 1.56, 0.64, 1] },
  { name: "anticipate", pts: [0.36, 0, 0.66, -0.56] },
  { name: "snap", pts: [0.16, 1, 0.3, 1] },
]

export default function BezierEditor(raw: BezierEditorProps) {
  const [props, rest] = splitProps(raw, ["modelValue", "class", "onUpdateModelValue"])
  const p = () => props.modelValue
  const path = createMemo(
    () => `M ${sx(0)} ${sy(0)} C ${sx(p()[0])} ${sy(p()[1])}, ${sx(p()[2])} ${sy(p()[3])}, ${sx(1)} ${sy(1)}`,
  )

  let svg: SVGSVGElement | undefined
  function dragHandle(which: 0 | 1, e: PointerEvent) {
    e.preventDefault()
    const move = (ev: PointerEvent) => {
      const r = svg?.getBoundingClientRect()
      if (!r) return
      const x = clamp((ev.clientX - r.left) / r.width, 0, 1)
      const y = clamp(Y_MAX - ((ev.clientY - r.top) / r.height) * (Y_MAX - Y_MIN), Y_MIN, Y_MAX)
      const next: [number, number, number, number] = [...p()] as never
      next[which * 2] = Math.round(x * 100) / 100
      next[which * 2 + 1] = Math.round(y * 100) / 100
      props.onUpdateModelValue?.(next)
    }
    move(e)
    followPointer(e, move)
  }

  function setNum(i: number, e: Event) {
    const v = Number((e.target as HTMLInputElement).value)
    if (!Number.isFinite(v)) return
    const next: [number, number, number, number] = [...p()] as never
    next[i] = clamp(v, i % 2 === 0 ? 0 : Y_MIN, i % 2 === 0 ? 1 : Y_MAX)
    props.onUpdateModelValue?.(next)
  }

  return (
    <div {...rest} class={cn("flex flex-col gap-2", props.class)}>
      <svg
        ref={(el) => (svg = el)}
        width={W}
        height={H}
        class="w-full cursor-crosshair touch-none rounded-md bg-background/60 ring-1 ring-border"
        viewBox={`0 0 ${W} ${H}`}
      >
        {/* unit box + diagonal reference */}
        <rect
          x={sx(0)}
          y={sy(1)}
          width={W}
          height={sy(0) - sy(1)}
          class="fill-none stroke-border"
          stroke-dasharray="3 3"
        />
        <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} class="stroke-border" stroke-dasharray="2 4" />
        {/* control arms */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(p()[0])} y2={sy(p()[1])} class="stroke-foreground/40" />
        <line x1={sx(1)} y1={sy(1)} x2={sx(p()[2])} y2={sy(p()[3])} class="stroke-foreground/40" />
        {/* curve */}
        <path d={path()} fill="none" class="stroke-foreground" stroke-width="2" />
        {/* endpoints */}
        <circle cx={sx(0)} cy={sy(0)} r="3" class="fill-muted-foreground" />
        <circle cx={sx(1)} cy={sy(1)} r="3" class="fill-muted-foreground" />
        {/* draggable control points: a 12px dot in a 28px reach, a finger's */}
        <Index each={[0, 1] as const}>
          {(which) => (
            <g
              class="cursor-grab active:cursor-grabbing"
              data-handle={which()}
              onPointerDown={(e) => dragHandle(which(), e)}
            >
              <circle cx={sx(p()[which() * 2])} cy={sy(p()[which() * 2 + 1])} r="14" class="fill-transparent" />
              <circle
                cx={sx(p()[which() * 2])}
                cy={sy(p()[which() * 2 + 1])}
                r="6"
                class="fill-foreground stroke-background"
                stroke-width="2"
              />
            </g>
          )}
        </Index>
      </svg>

      <div class="flex items-center gap-1.5">
        <span class="shrink-0 text-[10px] text-muted-foreground">cubic-bezier(</span>
        <Index each={p()}>
          {(v, i) => (
            <input
              type="number"
              name={`bezier-${i}`}
              step="0.01"
              value={v()}
              class="h-6 w-full min-w-0 rounded border border-edge bg-background/60 px-1 text-center text-[11px] tabular-nums text-foreground outline-none [appearance:textfield] focus:border-ring [&::-webkit-inner-spin-button]:appearance-none"
              onChange={(e) => setNum(i, e)}
            />
          )}
        </Index>
        <span class="shrink-0 text-[10px] text-muted-foreground">)</span>
      </div>

      <div class="flex flex-wrap gap-1">
        <For each={PRESETS}>
          {(pr) => (
            <button
              type="button"
              class="min-h-6 rounded border border-border px-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => props.onUpdateModelValue?.(pr.pts)}
            >
              {pr.name}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
