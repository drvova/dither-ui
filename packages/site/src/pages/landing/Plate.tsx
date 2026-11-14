// One plate of the series (`plate.ts`): a sheet of its own proportion on the
// page's width, on the page's own ground: the heat (`heat.ts`, the close's
// material) prints a cloud above its clear band and one below, through the
// plate's own printer's screen, still, dissolving at every edge, so the
// plate is a passage of the page and never a box; the brand
// (`BrandGather`) stands in the clear band, pulled in from the right
// edge where the plate is narrow, and gathers there once as the plate comes
// into view, while the tone prints in through the kit's reveal (the lights
// coming on). It holds as a scene (`SCENES.plate`): a run a little taller
// than the plate, the plate pinned in the viewport's middle through it,
// scaling up into place as the reader scrolls, then let go. Decorative.
import { DitherReveal, DitherScreen } from "@dither-ui/kit"
import { LOCKUP_SIZE } from "@/pages/landing/brand"
import { plateField, sceneOf, type Plate as PlateRow } from "@/pages/landing/plate"
import { SCENES } from "@/pages/landing/scenes"
import { scene } from "@/shared/lib/scroll-scene-ref"
import BrandGather from "./BrandGather"
import HeatPrint from "./HeatPrint"
import "./Plate.css"

type PlateProps = { plate: PlateRow }

const pct = (f: number) => `${f * 100}%`

const CELL = 4
const WIDTH = LOCKUP_SIZE.width * CELL
const HALF = 3.5 * CELL

export default function Plate(props: PlateProps) {
  const field = plateField(props.plate)
  return (
    <div
      ref={scene(SCENES.plate)}
      class="plate-scope plate-run"
      style={{ "--aspect": props.plate.aspect }}
      aria-hidden="true"
    >
      <div class="plate-pin">
        <div class="plate">
          <DitherScreen screen={props.plate.screen}>
            <DitherReveal class="plate-print" duration={0.72} easing="glide">
              <HeatPrint paused field={field} grain={props.plate.grain} />
            </DitherReveal>
          </DitherScreen>
          <BrandGather
            class="plate-lockup"
            scene={(height) => sceneOf(props.plate, height)}
            style={{
              left: `clamp(16px, calc(${pct(props.plate.mark[0])} - ${HALF}px), calc(100% - ${WIDTH + 16}px))`,
              top: `calc(${pct(props.plate.mark[1])} - ${HALF}px)`,
            }}
          />
        </div>
      </div>
      <div class="plate-hold" />
    </div>
  )
}
