// The mascot at the wheel of its car (`car.ts`): one picture on one cell
// grid, the car in the ink around it with its ember stripe, door diamond
// and tail light, the mascot behind the windscreen. `size` is its height in
// px. While `driving` its wheels turn; parked, they rest. Its motion is its
// stylesheet's, no script: what the wheels' turns share is drawn once, each
// turn's own spokes a group the stylesheet shows in its quarter of a turn
// (`MascotCar.css`, as the mascot's rotor steps), held still under reduced
// motion. Decorative: what it stands beside says what it means.
import { For, type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { type CarInk, DRIVEN_H, DRIVEN_TOP, DRIVEN_W, drivenCells, WHEEL_STEPS } from "@/shared/ui/car"
import { runPaths, stepCells } from "@/shared/ui/cells"
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
const painted = (cells: readonly Cell[]) =>
  runPaths(cells, paintOf).map((p) => ({ d: p.d, ...PAINT[p.paint as CarInk] }))

const STEPPED = stepCells(
  Array.from({ length: WHEEL_STEPS }, (_, turn) => drivenCells(turn)),
  paintOf,
)
/** The picture's still part, and each wheel turn's own cells, a path a paint. */
const STILL = painted(STEPPED.still)
const TURNS = STEPPED.steps.map(painted)

export default function MascotCar(raw: MascotCarProps) {
  const merged = mergeProps({ driving: false }, raw)
  const [props, rest] = splitProps(merged, ["size", "driving", "class"])

  return (
    <svg
      {...rest}
      class={cn("mascot-car-scope mascot-car", props.class)}
      data-driving={props.driving ? "" : undefined}
      viewBox={`0 ${DRIVEN_TOP} ${DRIVEN_W} ${DRIVEN_H}`}
      height={props.size}
      width={(props.size * DRIVEN_W) / DRIVEN_H}
      aria-hidden="true"
      {...{ focusable: "false" }}
      shape-rendering="crispEdges"
    >
      <For each={STILL}>{(p) => <path d={p.d} fill={p.fill} fill-opacity={p.opacity} />}</For>
      <For each={TURNS}>
        {(paths, turn) => (
          <g class="car-turn" style={{ "--turn": turn() }}>
            <For each={paths}>{(p) => <path d={p.d} fill={p.fill} fill-opacity={p.opacity} />}</For>
          </g>
        )}
      </For>
    </svg>
  )
}
