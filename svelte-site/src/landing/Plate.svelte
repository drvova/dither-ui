<script lang="ts">
  // One plate of the series (`plate.ts`): a sheet of its own proportion on the
  // page's width, square cornered and flat like the hero's print, on the
  // raised ground as its stock. The heat (`heat.ts`, the close's material)
  // prints above and below its clear band through the plate's own printer's
  // screen, still; the brand (`BrandGather.svelte`) stands in the clear
  // band, pulled in from the right edge where the plate is narrow, and forms
  // there once as the plate comes into view. Decorative.
  import { DitherScreen } from "@dither-kit-svelte"
  import { LOCKUP_SIZE } from "./brand"
  import BrandGather from "./BrandGather.svelte"
  import HeatPrint from "./HeatPrint.svelte"
  import { plateField, sceneOf, STOCK, type Plate } from "./plate"

  let { plate }: { plate: Plate } = $props()
  const pct = (f: number) => `${f * 100}%`
  const field = $derived(plateField(plate))

  const CELL = 4
  const WIDTH = LOCKUP_SIZE.width * CELL
  const HALF = 3.5 * CELL
</script>

<div class="plate" style:background={STOCK} style:aspect-ratio={plate.aspect} aria-hidden="true">
  <DitherScreen screen={plate.screen}>
    <HeatPrint paused {field} />
  </DitherScreen>
  <BrandGather
    class="plate-lockup"
    scene={(height) => sceneOf(plate, height)}
    style={`left: clamp(16px, calc(${pct(plate.mark[0])} - ${HALF}px), calc(100% - ${WIDTH + 16}px)); top: calc(${pct(plate.mark[1])} - ${HALF}px)`}
  />
</div>

<style>
  .plate {
    position: relative;
    isolation: isolate;
    width: 100%;
    max-width: 100%;
    min-height: 112px;
    overflow: hidden;
  }

  .plate :global(.plate-lockup) {
    position: absolute;
  }
</style>
