<script lang="ts">
  import type { VariantInput } from "./chart-context"
  import { registerVariant, usePolarPart } from "./polar-context"

  type Props = { variant?: VariantInput }
  let { variant = "gradient" }: Props = $props()

  const ctx = usePolarPart("Pie", "pie")
</script>

<!-- Slices are painted on the canvas; this part only registers the variant. -->
<g use:registerVariant={{ ctx, key: "*", variant }}></g>
