<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements"
  import { cn } from "../runtime/lib"
  import { cssColor } from "../engine/palette"
  import { CONTROL, useField } from "../runtime/control"

  type Props = {
    value?: string
    invalid?: boolean
    class?: string
  } & Omit<HTMLInputAttributes, "value" | "class">

  let {
    value = $bindable(""),
    type = "text",
    invalid: invalidProp = false,
    class: className,
    id,
    ...rest
  }: Props = $props()

  const field = useField()
  const invalid = $derived(invalidProp || field?.invalid || false)
  const describedBy = $derived(
    (rest["aria-describedby"] as string | undefined) ?? field?.describedBy
  )
</script>

<input
  {type}
  bind:value
  id={id ?? field?.controlId}
  aria-invalid={invalid || undefined}
  aria-describedby={describedBy}
  style:border-color={invalid ? cssColor("red") : undefined}
  class={cn(
    CONTROL,
    "w-full read-only:cursor-default read-only:bg-card/40 read-only:text-muted-foreground",
    className
  )}
  {...rest}
/>
