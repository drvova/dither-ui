<script lang="ts">
  import type { Snippet } from "svelte"
  import CartesianChart, { type CartesianChartProps } from "./CartesianChart.svelte"

  let { children, ...rest }: CartesianChartProps & { children?: Snippet } = $props()
</script>

<!-- Composable dither **bar** chart — <Bar> series, grouped or stacked. -->
<CartesianChart chartType="bar" {...rest}>
  {@render children?.()}
</CartesianChart>
