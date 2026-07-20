<script lang="ts">
  import type { Snippet } from "svelte"
  import PolarChart, { type PolarChartProps } from "./PolarChart.svelte"

  let { children, ...rest }: PolarChartProps & { children?: Snippet } = $props()
</script>

<!-- Composable dither **radar** chart. Compose <Radar> series, <Legend>, ... inside. -->
<PolarChart chartType="radar" {...rest}>
  {@render children?.()}
</PolarChart>
