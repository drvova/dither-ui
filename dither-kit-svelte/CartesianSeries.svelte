<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import {
    registerSeries,
    useChartPart,
    type SeriesKind,
    type SeriesSpec,
    type StrokeVariant,
    type VariantInput,
  } from "./chart-context"
  import { setSeries } from "./series-context"

  type Props = {
    part: string
    kind: SeriesKind
    dataKey: string
    variant?: VariantInput
    strokeVariant?: StrokeVariant
    isClickable?: boolean
    opacity?: number
    children?: Snippet
  }

  let {
    part,
    kind,
    dataKey,
    variant = "gradient",
    strokeVariant = "solid",
    isClickable = false,
    opacity = 1,
    children,
  }: Props = $props()

  // part/kind are static per instance; capture them once for the boundary guard.
  const ctx = untrack(() => useChartPart(part, kind === "line" ? "line" : "area"))

  untrack(() => {
    if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV && !ctx.config[dataKey]) {
      console.warn(
        `<${part} dataKey="${dataKey}" />: "${dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`
      )
    }
  })

  // Live series surface for markers — `seed`/`dimmed` are getters so `<Dot>` /
  // `<ActiveDot>` read the current selection state reactively.
  setSeries({
    get dataKey() {
      return dataKey
    },
    get seed() {
      return ctx.seedOf(dataKey)
    },
    get dimmed() {
      const e = ctx.selectedDataKey ?? ctx.focusDataKey
      return e !== null && e !== dataKey
    },
  })

  const spec: SeriesSpec = $derived({ dataKey, kind, variant, strokeVariant, opacity })
  const band = $derived(ctx.bands[dataKey])
  const hitPath = $derived.by(() => {
    if (!isClickable || !band) return null
    const b = band
    const parts: string[] = []
    b.forEach((pt, i) => {
      parts.push(`${i === 0 ? "M" : "L"}${ctx.xCenter(i)},${ctx.y(pt[1])}`)
    })
    for (let i = b.length - 1; i >= 0; i -= 1) {
      parts.push(`L${ctx.xCenter(i)},${ctx.y(b[i][0])}`)
    }
    return `${parts.join(" ")} Z`
  })

  function onClick() {
    if (!isClickable) return
    ctx.selectDataKey(ctx.selectedDataKey === dataKey ? null : dataKey)
  }
</script>

<g use:registerSeries={{ ctx, spec }}>
  {#if ctx.ready && band}
    {#if hitPath}
      <!-- svelte-ignore a11y_no_static_element_interactions (series hit-area is a pointer convenience; the Legend is the keyboard-accessible selector) -->
      <!-- svelte-ignore a11y_click_events_have_key_events (series hit-area is a pointer convenience; the Legend is the keyboard-accessible selector) -->
      <path d={hitPath} fill="transparent" style="cursor: pointer" onclick={onClick} />
    {/if}
    {@render children?.()}
  {/if}
</g>
