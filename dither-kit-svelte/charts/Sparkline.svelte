<script lang="ts">
  import AreaChart from "./AreaChart.svelte"
  import Area from "./Area.svelte"
  import type { ChartConfig, VariantInput } from "./chart-context"
  import type { BloomInput } from "../engine/dither-paint"
  import type { DitherColor } from "../engine/palette"

  type Props = {
    /** Plain numeric series — the common sparkline case. */
    data: number[]
    color: DitherColor
    variant?: VariantInput
    seed?: number
    markerIndex?: number | null
    hovered?: boolean
    bloom?: BloomInput
    bloomOnHover?: boolean
    animate?: boolean
    class?: string
  }

  let {
    data,
    color,
    variant = "gradient",
    seed,
    markerIndex = null,
    hovered = false,
    bloom = "off",
    bloomOnHover = false,
    animate = false,
    class: className,
  }: Props = $props()

  const rows = $derived(data.map((v) => ({ v })))
  const config = $derived<ChartConfig>({ v: { color } })
</script>

<AreaChart
  data={rows}
  {config}
  interactive={false}
  {animate}
  {seed}
  {markerIndex}
  {hovered}
  {bloom}
  {bloomOnHover}
  margins={{ top: 0, right: 0, bottom: 0, left: 0 }}
  class={className}
>
  <Area dataKey="v" {variant} />
</AreaChart>
