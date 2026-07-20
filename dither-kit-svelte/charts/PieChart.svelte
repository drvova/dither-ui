<script lang="ts">
  import type { Snippet } from "svelte"
  import PolarChart, { type PolarChartProps } from "./PolarChart.svelte"

  let { children, ...rest }: PolarChartProps & { children?: Snippet } = $props()
</script>

<!-- Composable dither **pie / donut** chart. Compose <Pie>, <Legend>, ... inside. -->
<PolarChart chartType="pie" {...rest}>
  {@render children?.()}
</PolarChart>
