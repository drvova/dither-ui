<script lang="ts" module>
  export type Option = { value: string; label: string; disabled?: boolean }
  let selectCount = 0
</script>

<script lang="ts">
  import { onMount, tick } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"
  import { CONTROL, POPOVER, useField } from "./control"
  import { cn } from "./lib"
  import { cssColor } from "./palette"
  import { pixelPrefersReducedMotion, type PixelColor } from "./pixel"

  type Props = {
    options: Option[]
    value?: string
    placeholder?: string
    color?: PixelColor
    disabled?: boolean
    invalid?: boolean
    class?: string
  } & Omit<HTMLButtonAttributes, "value" | "class" | "disabled">

  let {
    options,
    value = $bindable(""),
    placeholder = "Select…",
    color = "blue",
    disabled = false,
    invalid: invalidProp = false,
    class: className,
    id,
    ...rest
  }: Props = $props()

  const field = useField()
  let rootEl = $state<HTMLDivElement | null>(null)
  let triggerEl = $state<HTMLButtonElement | null>(null)
  let open = $state(false)
  let highlighted = $state(-1)
  const idBase = `dk-select-${selectCount++}`
  const listId = `${idBase}-listbox`
  const selected = $derived(options.find((o) => o.value === value) ?? null)
  const marker = $derived(cssColor(color))
  const invalid = $derived(invalidProp || field?.invalid || false)
  const describedBy = $derived(
    (rest["aria-describedby"] as string | undefined) ?? field?.describedBy
  )
  const optionId = (i: number) => `${idBase}-option-${i}`

  function openPanel() {
    if (disabled) return
    open = true
    const selectedIndex = options.findIndex((o) => o.value === value && !o.disabled)
    highlighted = selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled)
  }
  function close() {
    open = false
  }
  function pick(o: Option) {
    if (o.disabled) return
    value = o.value
    close()
    tick().then(() => triggerEl?.focus())
  }
  function move(dir: number) {
    const n = options.length
    if (!n) return
    let i = highlighted
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!options[i].disabled) return void (highlighted = i)
    }
  }
  function edge(toEnd: boolean) {
    const enabled = options.map((o, i) => ({ o, i })).filter(({ o }) => !o.disabled)
    highlighted = enabled[toEnd ? enabled.length - 1 : 0]?.i ?? -1
  }
  function onKeydown(e: KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        openPanel()
        if (e.key === "ArrowUp") edge(true)
      }
      return
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      move(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      edge(e.key === "End")
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const option = options[highlighted]
      if (option) pick(option)
    } else if (e.key === "Escape" || e.key === "Tab") close()
  }
  function onOutside(e: PointerEvent) {
    if (open && rootEl && !rootEl.contains(e.target as Node)) close()
  }
  onMount(() => {
    document.addEventListener("pointerdown", onOutside)
    return () => document.removeEventListener("pointerdown", onOutside)
  })

  /** Ports the Vue `<Transition name="dk-popover">` — a short translate + fade,
   * skipped entirely under reduced motion. */
  function popover(_node: Element) {
    if (pixelPrefersReducedMotion()) return {}
    return {
      duration: 140,
      css: (t: number) => `transform: translateY(${(t - 1) * 4}px); opacity: ${t}`,
    }
  }
</script>

<div bind:this={rootEl} class={cn("relative", className)}>
  <!-- svelte-ignore a11y_role_supports_aria_props_implicit (select trigger tracks the active option and validity, as in the Vue source) -->
  <button
    bind:this={triggerEl}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listId}
    aria-activedescendant={open && highlighted >= 0 ? optionId(highlighted) : undefined}
    aria-invalid={invalid || undefined}
    aria-describedby={describedBy}
    id={id ?? field?.controlId}
    {disabled}
    style:border-color={invalid ? cssColor("red") : undefined}
    class={cn(CONTROL, "flex w-full items-center justify-between gap-3 text-left")}
    onclick={() => (open ? close() : openPanel())}
    onkeydown={onKeydown}
    {...rest}
  >
    <span class="truncate {selected ? 'text-foreground' : 'text-muted-foreground/70'}"
      >{selected?.label ?? placeholder}</span
    >
    <span
      aria-hidden="true"
      class="text-muted-foreground transition-transform motion-reduce:transition-none {open
        ? 'rotate-180'
        : ''}">⌄</span
    >
  </button>
  {#if open}
    <div
      id={listId}
      role="listbox"
      transition:popover
      class={cn(POPOVER, "absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto p-1")}
    >
      {#each options as o, i (o.value)}
        <!-- svelte-ignore a11y_interactive_supports_focus (listbox options are not tab stops; focus stays on the trigger via aria-activedescendant) -->
        <div
          id={optionId(i)}
          role="option"
          aria-selected={o.value === value}
          aria-disabled={o.disabled || undefined}
          class="flex min-h-9 items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] {i ===
            highlighted && !o.disabled
            ? 'bg-background text-foreground'
            : ''} {o.disabled
            ? 'cursor-default opacity-40'
            : 'cursor-pointer text-muted-foreground hover:bg-background hover:text-foreground'}"
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
