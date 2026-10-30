<script lang="ts">
  import type { Snippet } from "svelte"
  import type { ScreenKind } from "../engine/pixel"
  import { setScreen } from "../runtime/screen"

  /* Prints everything inside it through one screen: every pixel surface and
     chart below it reads its threshold matrix from here, so a line, hatch,
     dot or cross screen replaces the Bayer pattern without a prop on each. */
  let { screen = "diagonal", children }: { screen?: ScreenKind; children?: Snippet } = $props()
  setScreen(() => screen)
</script>

{@render children?.()}
