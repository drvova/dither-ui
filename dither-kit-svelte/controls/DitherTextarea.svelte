<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements"
  import { cn } from "../runtime/lib"
  import { cssColor } from "../engine/palette"
  import { CONTROL, useField } from "../runtime/control"

  type Props = {
    value?: string
    resize?: "none" | "vertical" | "horizontal" | "both"
    invalid?: boolean
    class?: string
  } & Omit<HTMLTextareaAttributes, "value" | "class">

  let {
    value = $bindable(""),
    rows = 4,
    resize = "vertical",
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

<textarea
  bind:value
  {rows}
  id={id ?? field?.controlId}
  aria-invalid={invalid || undefined}
  aria-describedby={describedBy}
  style:resize
  style:border-color={invalid ? cssColor("red") : undefined}
  class={cn(
    CONTROL,
    "block w-full leading-relaxed read-only:cursor-default read-only:bg-card/40 read-only:text-muted-foreground",
    className
  )}
  {...rest}
></textarea>
