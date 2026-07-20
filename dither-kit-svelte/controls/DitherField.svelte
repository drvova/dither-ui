<script lang="ts" module>
  let fieldCount = 0
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { setField } from "../runtime/control"
  import { cssColor } from "../engine/palette"

  type Props = {
    label?: string
    description?: string
    error?: string
    for?: string
    children?: Snippet
  }

  let { label, description, error, for: forId, children }: Props = $props()

  const base = `dk-field-${fieldCount++}`
  const controlId = $derived(forId ?? `${base}-control`)
  const helpId = `${base}-help`
  const describedBy = $derived(error || description ? helpId : undefined)
  const invalid = $derived(!!error)

  // Svelte 5 reactive context: live getters replace Vue's `Ref`, so descendants
  // read `field.controlId` (not `.value`) and stay in sync as props change.
  setField({
    get controlId() {
      return controlId
    },
    get describedBy() {
      return describedBy
    },
    get invalid() {
      return invalid
    },
  })
</script>

<div class="grid gap-1.5">
  {#if label}
    <label for={controlId} class="text-[12px] font-medium text-foreground/90">
      {label}
    </label>
  {/if}
  {@render children?.()}
  {#if error}
    <p id={helpId} role="alert" class="flex items-center gap-1.5 text-[11px]" style:color={cssColor("red")}>
      <span aria-hidden="true" class="inline-block size-1.5" style:background={cssColor("red")}></span>
      {error}
    </p>
  {:else if description}
    <p id={helpId} class="text-[11px] leading-relaxed text-muted-foreground">
      {description}
    </p>
  {/if}
</div>
