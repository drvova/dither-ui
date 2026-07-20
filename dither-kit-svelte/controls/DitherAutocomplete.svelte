<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    suggestions: string[]
    value?: string
    placeholder?: string
    disabled?: boolean
    class?: string
  }

  let {
    suggestions,
    value = $bindable(""),
    placeholder = "Search…",
    disabled = false,
    class: className,
  }: Props = $props()

  let open = $state(false)
  let highlighted = $state(-1)

  const filtered = $derived.by(() => {
    const q = value.trim().toLowerCase()
    if (!q) return suggestions
    return suggestions.filter((s) => s.toLowerCase().includes(q))
  })

  function onInput(e: Event) {
    value = (e.target as HTMLInputElement).value
    open = true
    highlighted = 0
  }

  function pick(s: string) {
    value = s
    open = false
  }

  function move(dir: number) {
    const n = filtered.length
    if (!n) return
    highlighted = (highlighted + dir + n) % n
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) {
        open = true
        highlighted = 0
      } else {
        move(e.key === "ArrowDown" ? 1 : -1)
      }
    } else if (e.key === "Enter") {
      if (!open) return
      e.preventDefault()
      const s = filtered[highlighted]
      if (s !== undefined) pick(s)
    } else if (e.key === "Escape" && open) {
      e.preventDefault()
      open = false
    }
  }
</script>

<div class={cn("relative", className)}>
  <!-- svelte-ignore a11y_role_has_required_aria_props (aria-controls omitted as in the Vue source; the panel has no id) -->
  <input
    type="text"
    role="combobox"
    aria-expanded={open && filtered.length > 0}
    aria-autocomplete="list"
    aria-haspopup="listbox"
    {disabled}
    {placeholder}
    {value}
    class="w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
    oninput={onInput}
    onclick={() => (open = true)}
    onkeydown={onKeydown}
    onblur={() => (open = false)}
  />
  {#if open && filtered.length}
    <div
      role="listbox"
      class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1"
    >
      {#each filtered as s, i (s)}
        <!-- svelte-ignore a11y_interactive_supports_focus (listbox options are not tab stops; focus stays on the input) -->
        <div
          role="option"
          aria-selected={s === value}
          class="cursor-pointer rounded-md px-2 py-1.5 text-[12px] {i === highlighted
            ? 'bg-background text-foreground'
            : 'text-muted-foreground hover:bg-background hover:text-foreground'}"
          onpointerenter={() => (highlighted = i)}
          onpointerdown={(e) => {
            e.preventDefault()
            pick(s)
          }}
        >
          {s}
        </div>
      {/each}
    </div>
  {/if}
</div>
