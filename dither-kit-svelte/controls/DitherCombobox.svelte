<script lang="ts">
  import type { Option } from "./DitherSelect.svelte"
  import { cn } from "../runtime/lib"
  import { cssColor } from "../engine/palette"
  import type { PixelColor } from "../engine/pixel"

  type Props = {
    options: Option[]
    value?: string
    placeholder?: string
    color?: PixelColor
    disabled?: boolean
    class?: string
  }

  let {
    options,
    value = $bindable(""),
    placeholder = "Select…",
    color = "blue",
    disabled = false,
    class: className,
  }: Props = $props()

  let open = $state(false)
  let highlighted = $state(-1)
  // `typed` is the in-progress query; null means "show the selected label".
  // This derives the Vue `query` ref + its `watch(modelValue)` without `$effect`.
  let typed = $state<string | null>(null)

  const selected = $derived(options.find((o) => o.value === value) ?? null)
  const marker = $derived(cssColor(color))
  const query = $derived(typed ?? selected?.label ?? "")

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  })

  function openPanel() {
    open = true
    const i = filtered.findIndex((o) => o.value === value && !o.disabled)
    highlighted = i >= 0 ? i : filtered.findIndex((o) => !o.disabled)
  }

  function onInput(e: Event) {
    typed = (e.target as HTMLInputElement).value
    open = true
    highlighted = filtered.findIndex((o) => !o.disabled)
  }

  function pick(o: Option) {
    if (o.disabled) return
    value = o.value
    typed = null
    open = false
  }

  /** Blur / Escape — snap the text back to the last valid value. */
  function revert() {
    open = false
    typed = null
  }

  function move(dir: number) {
    const list = filtered
    const n = list.length
    let i = highlighted
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!list[i].disabled) {
        highlighted = i
        return
      }
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) openPanel()
      else move(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Enter") {
      if (!open) return
      e.preventDefault()
      const o = filtered[highlighted]
      if (o) pick(o)
    } else if (e.key === "Escape" && open) {
      e.preventDefault()
      revert()
    }
  }
</script>

<div class={cn("relative", className)}>
  <!-- svelte-ignore a11y_role_has_required_aria_props (aria-controls omitted as in the Vue source; the panel has no id) -->
  <input
    type="text"
    role="combobox"
    aria-expanded={open}
    aria-autocomplete="list"
    aria-haspopup="listbox"
    {disabled}
    {placeholder}
    value={query}
    class="w-full rounded-md border border-border bg-background/60 px-3 py-2 pr-8 font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    oninput={onInput}
    onclick={() => {
      if (!open) openPanel()
    }}
    onkeydown={onKeydown}
    onblur={revert}
  />
  <span
    aria-hidden="true"
    class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
    >▾</span
  >
  {#if open}
    <div
      role="listbox"
      class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1"
    >
      {#if !filtered.length}
        <div class="px-2 py-1.5 text-[12px] text-muted-foreground italic">
          no matches
        </div>
      {/if}
      {#each filtered as o, i (o.value)}
        <!-- svelte-ignore a11y_interactive_supports_focus (listbox options are not tab stops; focus stays on the input) -->
        <div
          role="option"
          aria-selected={o.value === value}
          aria-disabled={o.disabled || undefined}
          class="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-[12px] {i ===
            highlighted && !o.disabled
            ? 'bg-background'
            : ''} {o.disabled
            ? 'cursor-default opacity-40'
            : o.value === value || i === highlighted
              ? 'text-foreground'
              : 'text-muted-foreground hover:bg-background hover:text-foreground'}"
          onpointerenter={() => {
            if (!o.disabled) highlighted = i
          }}
          onpointerdown={(e) => {
            e.preventDefault()
            pick(o)
          }}
        >
          <span>{o.label}</span>
          {#if o.value === value}
            <span
              aria-hidden="true"
              class="size-2 shrink-0"
              style:background-color={marker}
              style:image-rendering="pixelated"
            ></span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
