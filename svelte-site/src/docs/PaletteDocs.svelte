<script lang="ts">
  import { Sparkline, cssColor, type DitherColor } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable from "./PropsTable.svelte"

  const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]
  const wave = Array.from({ length: 20 }, (_, i) => 5 + Math.sin(i * 0.6) * 2.2 + Math.sin(i * 1.4) * 1)

  const paletteSnippet = `import { cssColor, type DitherColor } from "@dither-kit-svelte"
cssColor("blue") // "var(--swatch-blue)"`

  const paletteRowsApi = [
    { prop: "cssColor(c)", type: "(DitherColor | number | string) → css string", default: "—" },
    { prop: "rgb(seed, k?, a?)", type: "(Rgb, number?, number?) → rgba string", default: "—" },
    { prop: "DitherColor", type: '"green" … "grey" — seven seeds', default: "—" },
  ]
</script>

<!-- Palette -->
<section id="palette" class="mt-20 scroll-mt-20 pb-24">
  <h2 class="text-lg tracking-tight">Palette</h2>
  <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground">
    Seven seeded colors; every component resolves fill, line and sparkle hues
    from the same seed, so a dashboard stays coherent for free.
  </p>
  <DemoCard code={paletteSnippet}>
    <div class="grid gap-3">
      {#each COLORS as c (c)}
        <div class="flex items-center gap-4">
          <span class="w-14 text-[11px] text-muted-foreground">{c}</span>
          <span class="size-5 rounded-[3px]" style:background-color={cssColor(c)}></span>
          <Sparkline data={wave} color={c} class="h-6 flex-1" />
        </div>
      {/each}
    </div>
  </DemoCard>
  <PropsTable rows={paletteRowsApi} />
</section>
