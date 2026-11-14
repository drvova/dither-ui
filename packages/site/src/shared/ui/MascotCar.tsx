// The mascot at the wheel of its car (`car.ts`): one picture on one cell
// grid, the car in the ink around it with its ember stripe, door diamond
// and tail light, the mascot behind the windscreen. `size` is its height in
// px. While `driving` its wheels turn (held still under reduced motion);
// parked, they rest. Decorative: what it stands beside says what it means.
import {
  createEffect,
  createMemo,
  createSignal,
  Index,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { type CarInk, DRIVEN_H, DRIVEN_TOP, DRIVEN_W, drivenCells, toRuns, WHEEL_STEPS } from "@/shared/ui/car"
import "./MascotCar.css"

type Own = { size: number; driving?: boolean; class?: string }
type MascotCarProps = Own & Omit<JSX.SvgSVGAttributes<SVGSVGElement>, keyof Own>

const SIGNAL = "var(--signal, var(--swatch-orange))"
/** A car cell's paint: the body a shade under the ink so its lights read
 * brighter, the glass and the tyres fainter, the stripe and lights in ember. */
const PAINT: Record<CarInk, { fill: string; opacity?: number }> = {
  body: { fill: "currentColor", opacity: 0.82 },
  light: { fill: "currentColor" },
  glass: { fill: "currentColor", opacity: 0.32 },
  tyre: { fill: "currentColor", opacity: 0.42 },
  ember: { fill: SIGNAL },
}
type Cell = ReturnType<typeof drivenCells>[number]
const paintOf = (c: Cell) => ("driver" in c ? (c.ink === "ember" ? "ember" : "light") : c.ink)

export default function MascotCar(raw: MascotCarProps) {
  const merged = mergeProps({ driving: false }, raw)
  const [props, rest] = splitProps(merged, ["size", "driving", "class"])

  const [turn, setTurn] = createSignal(0)

  /** Each row's same-paint neighbours as one rect. */
  const runs = createMemo(() =>
    toRuns(drivenCells(turn()), paintOf).map((r) => ({ ...r, ...PAINT[r.paint as CarInk] })),
  )

  let spin: ReturnType<typeof setInterval> | undefined
  const still = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  onMount(() => {
    createEffect(
      on(
        () => props.driving,
        (driving) => {
          clearInterval(spin)
          if (driving && !still()) spin = setInterval(() => setTurn((t) => (t + 1) % WHEEL_STEPS), 70)
        },
      ),
    )
    onCleanup(() => clearInterval(spin))
  })

  return (
    <svg
      {...rest}
      class={cn("mascot-car-scope mascot-car", props.class)}
      viewBox={`0 ${DRIVEN_TOP} ${DRIVEN_W} ${DRIVEN_H}`}
      height={props.size}
      width={(props.size * DRIVEN_W) / DRIVEN_H}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
    >
      <Index each={runs()}>
        {(r) => <rect x={r().x} y={r().y} width={r().w} height="1" fill={r().fill} fill-opacity={r().opacity} />}
      </Index>
    </svg>
  )
}
