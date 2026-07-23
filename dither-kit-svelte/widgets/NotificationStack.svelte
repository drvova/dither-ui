<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"

  export type NotificationItem = {
    id: string
    title: string
    body?: string
    time?: string
    /** Text glyph for the leading icon box; omit for a dithered color dot. */
    icon?: string
    color?: PixelColor
  }

  const CARD = 64
  const GAP = 8
  const SPRING = "cubic-bezier(0.2, 1.4, 0.4, 1)"

  /** Collapsed silhouettes — one expansion mechanism, three summaries. */
  const VARIANTS = {
    stack: { peek: 10, origin: "50% 0%", at: (i: number) => `translateY(${i * 10}px) scale(${1 - i * 0.04})` },
    fan: { peek: 7, origin: "50% 130%", at: (i: number) => `translateY(${i * 7}px) rotate(${(i % 2 ? -1 : 1) * i * 2.2}deg) scale(${1 - i * 0.03})` },
    condensed: { peek: 4, origin: "50% 0%", at: (i: number) => `translateY(${i * 4}px) scale(${1 - i * 0.07})` },
  } as const
  export type NotificationStackVariant = keyof typeof VARIANTS
</script>

<script lang="ts">
  import { fade } from "svelte/transition"
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"

  /** Compact notification cards that spring from a stacked summary into a
   * readable list on hover, focus or tap — tap pins the list open (bindable),
   * hover and focus expand transiently. Cards fan out on the house bouncy
   * bezier with a per-card stagger; reduced motion snaps. */
  type Props = {
    items: NotificationItem[]
    /** Pinned-open state (bindable); hover and focus expand transiently. */
    value?: boolean
    maxVisible?: number
    collapsedLabel?: string
    expandedLabel?: string
    emptyLabel?: string
    variant?: NotificationStackVariant
    color?: PixelColor
    class?: string
    onviewall?: () => void
  }
  let {
    items,
    value = $bindable(false),
    maxVisible = 3,
    collapsedLabel = "Notifications",
    expandedLabel = "View all",
    emptyLabel = "All caught up",
    variant = "stack",
    color = "blue",
    class: className,
    onviewall,
  }: Props = $props()

  const rm = pixelPrefersReducedMotion()

  let hovering = $state(false)
  let focused = $state(false)

  const visible = $derived(items.slice(0, Math.max(1, maxVisible)))
  const expanded = $derived(value || hovering || focused)
  const height = $derived.by(() => {
    const n = visible.length
    if (!n) return CARD
    return expanded ? n * (CARD + GAP) - GAP : CARD + (n - 1) * VARIANTS[variant].peek
  })
  function cardStyle(i: number): string {
    const transform = expanded ? `translateY(${i * (CARD + GAP)}px)` : VARIANTS[variant].at(i)
    const origin = expanded ? "50% 0%" : VARIANTS[variant].origin
    const opacity = expanded ? 1 : Math.max(0.35, 1 - i * 0.25)
    const delay = (expanded ? i : visible.length - 1 - i) * 40
    return `transform:${transform};transform-origin:${origin};opacity:${opacity};z-index:${visible.length - i};transition-delay:${delay}ms;transition-timing-function:${SPRING}`
  }
</script>

{#snippet cardBody(item: NotificationItem)}
  <span
    aria-hidden="true"
    class="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-background/60 text-[13px]"
    style:color={cssColor(item.color ?? color)}
  >
    {#if item.icon}
      {item.icon}
    {:else}
      <span class="size-2 rounded-[2px]" style:background={cssColor(item.color ?? color)}></span>
    {/if}
  </span>
  <span class="min-w-0 flex-1">
    <span class="flex items-baseline justify-between gap-2">
      <span class="truncate text-[12px] text-foreground">{item.title}</span>
      {#if item.time}
        <span class="shrink-0 text-[9px] text-muted-foreground/80">{item.time}</span>
      {/if}
    </span>
    {#if item.body}
      <span class="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.body}</span>
    {/if}
  </span>
{/snippet}

<div
  class={cn("w-72 font-mono select-none", className)}
  role="group"
  aria-label={collapsedLabel}
  onpointerenter={() => (hovering = true)}
  onpointerleave={() => (hovering = false)}
  onfocusin={() => (focused = true)}
  onfocusout={() => (focused = false)}
>
  <div class="flex h-7 items-center justify-between gap-2 px-1">
    <span class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {collapsedLabel}
      {#if items.length}
        <span class="rounded-full border border-border/60 bg-background/60 px-1.5 text-[9px] tabular-nums">
          {items.length}
        </span>
      {/if}
    </span>
    {#if expanded && items.length > 0}
      <button
        type="button"
        class={cn(CONTROL_BUTTON, "rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground")}
        transition:fade={{ duration: rm ? 0 : 160 }}
        onclick={() => onviewall?.()}
      >
        {expandedLabel} →
      </button>
    {/if}
  </div>

  {#if !visible.length}
    <div class="flex h-16 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-[12px] text-muted-foreground">
      {emptyLabel}
    </div>
  {:else}
    <div
      class="relative transition-[height] duration-300 motion-reduce:transition-none"
      style:height={`${height}px`}
      style:transition-timing-function={SPRING}
    >
      {#each visible as item, i (item.id)}
        {#if i === 0}
          <button
            type="button"
            aria-expanded={value}
            aria-label={collapsedLabel}
            class={cn(
              CONTROL_BUTTON,
              "absolute inset-x-0 top-0 flex h-16 items-center gap-2.5 overflow-hidden rounded-lg border border-border/60 bg-card px-3 text-left transition-[transform,opacity] duration-300 motion-reduce:transition-none"
            )}
            style={cardStyle(i)}
            onclick={() => (value = !value)}
          >
            {@render cardBody(item)}
          </button>
        {:else}
          <div
            class="absolute inset-x-0 top-0 flex h-16 items-center gap-2.5 overflow-hidden rounded-lg border border-border/60 bg-card px-3 text-left transition-[transform,opacity] duration-300 motion-reduce:transition-none"
            style={cardStyle(i)}
            aria-hidden={!expanded}
          >
            {@render cardBody(item)}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
