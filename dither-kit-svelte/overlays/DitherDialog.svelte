<script lang="ts" module>
  let dialogCount = 0
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { fade } from "svelte/transition"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import { portal } from "../runtime/portal"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    open: boolean
    title?: string
    description?: string
    closeOnBackdrop?: boolean
    class?: string
    onclose?: () => void
    children?: Snippet
    footer?: Snippet
  }
  let {
    open,
    title,
    description,
    closeOnBackdrop = true,
    class: className,
    onclose,
    children,
    footer,
  }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  const idBase = `dk-dialog-${dialogCount++}`
  const titleId = `${idBase}-title`
  const descriptionId = `${idBase}-description`

  let panelEl = $state<HTMLElement | null>(null)
  let closeEl = $state<HTMLButtonElement | null>(null)

  const focusable = () => [
    ...(panelEl?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []),
  ]
  function focusInitial() {
    if (closeEl) closeEl.focus()
    else focusable()[0]?.focus()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      onclose?.()
      return
    }
    if (e.key !== "Tab") return
    const items = focusable()
    if (!items.length) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Panel mount = open (capture + move focus); destroy = close (restore focus).
  function dialogFocus(_node: HTMLElement) {
    const previousFocus = document.activeElement as HTMLElement | null
    requestAnimationFrame(focusInitial)
    return {
      destroy() {
        previousFocus?.focus()
      },
    }
  }

  function popScale(_node: HTMLElement, opts: { duration: number }) {
    return {
      duration: opts.duration,
      css: (t: number, u: number) =>
        `opacity:${t};transform:translateY(${u * 8}px) scale(${0.98 + t * 0.02})`,
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions (backdrop click-catcher; the dialog role is on the panel below) -->
  <div
    use:portal
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6"
    transition:fade={{ duration: rm ? 0 : 160 }}
    onpointerdown={(e) => {
      if (e.target === e.currentTarget && closeOnBackdrop) onclose?.()
    }}
    onkeydown={onKeydown}
  >
    <div
      bind:this={panelEl}
      use:dialogFocus
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Dialog"}
      aria-describedby={description ? descriptionId : undefined}
      class={cn(
        "w-full max-w-md overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]",
        className
      )}
      transition:popScale={{ duration: rm ? 0 : 180 }}
    >
      <header
        class="flex min-h-12 items-start justify-between gap-4 border-b border-border/60 px-4 py-3"
      >
        <div class="min-w-0">
          {#if title}
            <h2 id={titleId} class="text-sm font-medium text-foreground">{title}</h2>
          {/if}
          {#if description}
            <p id={descriptionId} class="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          {/if}
        </div>
        <button
          bind:this={closeEl}
          type="button"
          class={cn(
            CONTROL_BUTTON,
            "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          )}
          aria-label="Close"
          onclick={() => onclose?.()}
        >
          ×
        </button>
      </header>
      <div class="p-4">{@render children?.()}</div>
      {#if footer}
        <footer class="flex justify-end gap-2 border-t border-border/60 px-4 py-3">
          {@render footer()}
        </footer>
      {/if}
    </div>
  </div>
{/if}
