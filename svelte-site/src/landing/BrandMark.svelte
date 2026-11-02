<script lang="ts">
  // The brand mark: the 7x7 dithered diamond, ember core, `size` px square;
  // given `cells`, another mark on the same grid in the same hand (the close
  // mark). Decorative: its link or its place names it.
  import { MARK_CELLS } from "./brand"

  let {
    size,
    cells = MARK_CELLS,
  }: { size: number; cells?: readonly { x: number; y: number; core?: boolean }[] } = $props()
</script>

<svg viewBox="0 0 7 7" width={size} height={size} aria-hidden="true" focusable="false" shape-rendering="crispEdges">
  {#each cells as c (`${c.x}.${c.y}`)}
    <rect x={c.x} y={c.y} width="1" height="1" fill={c.core ? "var(--signal)" : "currentColor"} />
  {/each}
</svg>
