<script lang="ts">
  import type { Snippet } from "svelte"
  import CartesianSeries from "./CartesianSeries.svelte"
  import type { StrokeVariant, VariantInput } from "./chart-context"

  type Props = {
    dataKey: string
    variant?: VariantInput
    strokeVariant?: StrokeVariant
    isClickable?: boolean
    opacity?: number
    children?: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<CartesianSeries part="Area" kind="area" {...rest}>
  {@render children?.()}
</CartesianSeries>
