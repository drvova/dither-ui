<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import {
    registerSeries,
    useChartPart,
    type SeriesSpec,
    type StrokeVariant,
    type VariantInput,
  } from "./chart-context"
  import { setSeries } from "./series-context"

  type Props = {
    dataKey: string
    variant?: VariantInput
    strokeVariant?: StrokeVariant
    isClickable?: boolean
    opacity?: number
    children?: Snippet
  }

  let {
    dataKey,
    variant = "gradient",
    strokeVariant = "solid",
    isClickable = false,
    opacity = 1,
    children,
  }: Props = $props()

  const ctx = useChartPart("Bar", "bar")

  untrack(() => {
    if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV && !ctx.config[dataKey]) {
      console.warn(
        `<Bar dataKey="${dataKey}" />: "${dataKey}" is not in the chart \`config\`. Add it so the series has a colour and label.`
      )
    }
  })

  setSeries({
    get dataKey() {
      return dataKey
    },
    get seed() {
      return ctx.seedOf(dataKey)
    },
    get dimmed() {
      return ctx.selectedDataKey !== null && ctx.selectedDataKey !== dataKey
    },
  })

  const spec: SeriesSpec = $derived({ dataKey, kind: "bar", variant, strokeVariant, opacity })
  const band = $derived(ctx.bands[dataKey])
  const si = $derived(ctx.configKeys.indexOf(dataKey))
  const rects = $derived.by(() => {
    if (!isClickable || !band) return []
    const n = ctx.configKeys.length
    return band.map((b, i) => {
      const slot = ctx.barSlot(i, si, n)
      const top = ctx.y(b[1])
      const base = ctx.y(b[0])
      return {
        x: slot.x,
        y: Math.min(top, base),
        width: slot.width,
        height: Math.abs(base - top),
      }
    })
  })

  function onClick() {
    ctx.selectDataKey(ctx.selectedDataKey === dataKey ? null : dataKey)
  }
</script>

<svg
  class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
  style:z-index={20}
  aria-hidden="true"
  use:registerSeries={{ ctx, spec }}
>
  {#if ctx.ready && band && rects.length > 0}
    <g transform={`translate(${ctx.margins.left},${ctx.margins.top})`}>
      {#each rects as r, i (i)}
        <!-- svelte-ignore a11y_no_static_element_interactions (bar hit-area is a pointer convenience; the Legend is the keyboard-accessible selector) -->
        <!-- svelte-ignore a11y_click_events_have_key_events (bar hit-area is a pointer convenience; the Legend is the keyboard-accessible selector) -->
        <rect
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          class="pointer-events-auto"
          fill="transparent"
          style="cursor: pointer"
          onclick={onClick}
        />
      {/each}
    </g>
  {/if}
</svg>
{#if ctx.ready && band}
  {@render children?.()}
{/if}
