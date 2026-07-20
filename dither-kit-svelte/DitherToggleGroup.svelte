<script lang="ts">
  import { tick } from "svelte"
  import type { Option } from "./DitherSelect.svelte"
  import { paintToggleCanvas } from "./DitherToggle.svelte"
  import { cn } from "./lib"
  import { fillOf, type PixelColor } from "./pixel"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    options: Option[]
    value?: string | string[]
    type?: "single" | "multiple"
    color?: PixelColor
    class?: string
  }

  let {
    options,
    value = $bindable<string | string[]>(""),
    type = "single",
    color = "blue",
    class: className,
  }: Props = $props()

  function isOn(o: Option): boolean {
    return Array.isArray(value) ? value.includes(o.value) : value === o.value
  }

  const activeIndex = $derived.by(() => {
    if (Array.isArray(value)) return 0
    const i = options.findIndex((o) => o.value === value)
    return i >= 0 ? i : 0
  })

  let btnEls = $state<(HTMLButtonElement | null)[]>([])

  function pick(o: Option) {
    if (o.disabled) return
    if (type === "multiple") {
      const cur = Array.isArray(value) ? value : []
      value = cur.includes(o.value)
        ? cur.filter((v) => v !== o.value)
        : [...cur, o.value]
    } else {
      value = o.value
    }
  }

  // Reading `value`/`color` here (not inside the closure) lets Svelte track
  // them, so a change re-invokes the action's `update` and repaints.
  function makePaint(o: Option): CanvasPaint {
    const on = isOn(o)
    const fill = fillOf(color)
    return (canvas, host) => {
      if (!on) return
      paintToggleCanvas(host, canvas, fill)
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (type !== "single") return
    const dir =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0
    if (!dir) return
    e.preventDefault()
    const n = options.length
    let i = activeIndex
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!options[i].disabled) {
        value = options[i].value
        const target = i
        tick().then(() => btnEls[target]?.focus())
        return
      }
    }
  }
</script>

<div
  role={type === "single" ? "radiogroup" : "group"}
  class={cn("inline-flex gap-1 rounded-md border border-border/60 p-1", className)}
  onkeydown={onKeydown}
>
  {#each options as o, i (o.value)}
    <button
      bind:this={btnEls[i]}
      type="button"
      role={type === "single" ? "radio" : undefined}
      aria-checked={type === "single" ? isOn(o) : undefined}
      aria-pressed={type === "multiple" ? isOn(o) : undefined}
      tabindex={type === "single" ? (i === activeIndex ? 0 : -1) : undefined}
      disabled={o.disabled}
      class={cn(
        "relative isolate overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        isOn(o)
          ? "border-transparent text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
      onclick={() => pick(o)}
    >
      <canvas
        use:paintOnResize={makePaint(o)}
        aria-hidden="true"
        class="absolute inset-0 -z-10 h-full w-full"
        style:display={isOn(o) ? null : "none"}
        style="image-rendering: pixelated"
      ></canvas>
      <span class="relative">{o.label}</span>
    </button>
  {/each}
</div>
