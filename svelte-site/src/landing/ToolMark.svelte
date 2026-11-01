<script lang="ts">
  // A tool's mark in currentColor. Always decorative: the tool's name is the
  // text beside it. The marks are the Vue site's own table
  // (`src/shared/ui/marks.ts`, the tools' real logos), read by path, never
  // copied, so the two sites show one set.
  import { MARKS, type MarkId } from "../../../src/shared/ui/marks"

  let { id, size = 14 }: { id: MarkId; size?: number } = $props()
  const mark = $derived(MARKS[id])
</script>

<svg
  viewBox={mark.viewBox}
  width={size}
  height={size}
  fill="currentColor"
  fill-rule={"evenodd" in mark ? "evenodd" : undefined}
  aria-hidden="true"
  focusable="false"
  class="tool-mark"
>
  {#each mark.d as d, i (i)}
    <path {d} />
  {/each}
</svg>

<style>
  .tool-mark {
    flex: none;
  }
</style>
