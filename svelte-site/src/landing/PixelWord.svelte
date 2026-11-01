<script lang="ts">
  // A word in the pixel face (`pixel-type.ts`), `cell` px a cell, in the
  // current ink: the kit's parts' names, chunky. Decorative: its heading
  // carries the name as text.
  import { layoutPixelText, PIXEL_ROWS } from "./pixel-type"

  let { text, cell = 5 }: { text: string; cell?: number } = $props()
  const laid = $derived(layoutPixelText(text))
</script>

<svg
  viewBox={`0 0 ${laid.width} ${PIXEL_ROWS}`}
  width={laid.width * cell}
  height={PIXEL_ROWS * cell}
  aria-hidden="true"
  focusable="false"
  shape-rendering="crispEdges"
>
  {#each laid.cells as c, i (i)}
    <rect x={c.x} y={c.y} width="1" height="1" fill="currentColor" />
  {/each}
</svg>
