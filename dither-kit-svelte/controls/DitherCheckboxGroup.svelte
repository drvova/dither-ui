<script lang="ts">
  import DitherCheckbox from "./DitherCheckbox.svelte"
  import type { Option } from "./DitherSelect.svelte"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  type Props = {
    options: Option[]
    value?: string[]
    color?: PixelColor
    label?: string
    class?: string
  }

  let {
    options,
    value = $bindable<string[]>([]),
    color = "blue",
    label,
    class: className,
  }: Props = $props()

  function toggle(v: string, on: boolean) {
    value = on ? [...value, v] : value.filter((x) => x !== v)
  }
</script>

<div role="group" aria-label={label} class={cn("grid gap-3", className)}>
  {#each options as o (o.value)}
    <DitherCheckbox
      bind:value={() => value.includes(o.value), (on) => toggle(o.value, on)}
      {color}
      disabled={o.disabled}
    >
      {o.label}
    </DitherCheckbox>
  {/each}
</div>
