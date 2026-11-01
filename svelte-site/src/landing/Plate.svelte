<script lang="ts">
  // One plate of the series (`plate.ts`): a sheet of its own proportion on the
  // page's width, square cornered and flat like the hero's print, on the
  // raised ground as its stock. Each half shows only the thin end of its ramp
  // (the ramp runs 1/tone times the half's depth), through the plate's own
  // printer's screen; the brand (`BrandGather.svelte`) stands in the clear
  // band, pulled in from the right edge where the plate is narrow, and forms
  // there once as the plate comes into view. Decorative.
  import { DitherGradient, DitherScreen } from "@dither-kit-svelte"
  import { LOCKUP_SIZE } from "./brand"
  import BrandGather from "./BrandGather.svelte"
  import { sceneOf, STOCK, type Plate } from "./plate"

  let { plate }: { plate: Plate } = $props()
  const pct = (f: number) => `${f * 100}%`

  const CELL = 4
  const WIDTH = LOCKUP_SIZE.width * CELL
  const HALF = 3.5 * CELL
</script>

<div class="plate" style:background={STOCK} style:aspect-ratio={plate.aspect} aria-hidden="true">
  <DitherScreen screen={plate.screen}>
    <div class="plate-tone" style:top="0" style:height={pct(plate.band[0])}>
      <div class="plate-ramp" style:bottom="0" style:height={pct(1 / plate.sky)}>
        <DitherGradient from="#e4e1d8" to={STOCK} direction="down" cell={CELL} />
      </div>
    </div>
    <div class="plate-tone" style:top={pct(plate.band[1])} style:bottom="0">
      <div class="plate-ramp" style:top="0" style:height={pct(1 / plate.ground)}>
        <DitherGradient from="#e4e1d8" to={STOCK} direction="up" cell={CELL} />
      </div>
    </div>
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
    width: 100%;
    max-width: 100%;
    min-height: 112px;
    overflow: hidden;
  }

  .plate-tone {
    position: absolute;
    inset-inline: 0;
    overflow: hidden;
  }

  .plate-ramp {
    position: absolute;
    inset-inline: 0;
  }

  .plate :global(.plate-lockup) {
    position: absolute;
  }
</style>
