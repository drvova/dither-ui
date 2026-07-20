<script lang="ts">
  import type { Snippet } from "svelte"
  import CartesianChart, { type CartesianChartProps } from "./CartesianChart.svelte"

  let { children, ...rest }: CartesianChartProps & { children?: Snippet } = $props()
</script>

<!-- Composable dither **line** chart — <Line> series with a glow under the line. -->
<CartesianChart chartType="line" {...rest}>
  {@render children?.()}
</CartesianChart>
