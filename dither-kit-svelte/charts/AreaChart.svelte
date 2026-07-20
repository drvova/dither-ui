<script lang="ts">
  import type { Snippet } from "svelte"
  import CartesianChart, { type CartesianChartProps } from "./CartesianChart.svelte"

  let { children, ...rest }: CartesianChartProps & { children?: Snippet } = $props()
</script>

<!-- Composable dither **area** chart. Compose <Area>, <Grid>, axes, ... inside. -->
<CartesianChart chartType="area" {...rest}>
  {@render children?.()}
</CartesianChart>
