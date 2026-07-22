<script lang="ts">
  import type { Snippet } from "svelte"
  import { cubicInOut } from "svelte/easing"
  import { fade } from "svelte/transition"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import { portal } from "../runtime/portal"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    open: boolean
    label?: string
    closeOnBackdrop?: boolean
    class?: string
    onclose?: () => void
    children?: Snippet
  }
  let {
    open,
    label = "Modal",
    closeOnBackdrop = true,
    class: className,
    onclose,
    children,
  }: Props = $props()

  const rm = pixelPrefersReducedMotion()

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
  function modalFocus(_node: HTMLElement) {
    const previousFocus = document.activeElement as HTMLElement | null
    requestAnimationFrame(focusInitial)
    return {
      destroy() {
        previousFocus?.focus()
      },
    }
  }

  // Center unfold: point -> full-width hairline slit -> full surface.
  // Runs 1 -> 0 on out, so the surface folds back the same way.
  const SPLIT = 0.46
  function unfold(_node: Element, opts: { duration: number }) {
    return {
      duration: opts.duration,
      easing: cubicInOut,
      css: (t: number) => {
        const x = t < SPLIT ? (1 - t / SPLIT) * 50 : 0
        const y = t < SPLIT ? 1 : 1 - (t - SPLIT) / (1 - SPLIT)
        return `clip-path: inset(calc((50% - 1px) * ${y}) ${x}% round 0.75rem)`
      },
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions (backdrop click-catcher; the dialog role is on the panel below) -->
  <div
    use:portal
    class="fixed inset-0 z-50 bg-black/65 p-4 sm:p-6"
    in:fade={{ duration: rm ? 0 : 480 }}
    out:fade={{ duration: rm ? 0 : 220, delay: rm ? 0 : 200 }}
    onpointerdown={(e) => {
      if (e.target === e.currentTarget && closeOnBackdrop) onclose?.()
    }}
    onkeydown={onKeydown}
  >
    <div
      bind:this={panelEl}
      use:modalFocus
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-label={label}
      class={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]",
        className
      )}
      in:unfold={{ duration: rm ? 0 : 480 }}
      out:unfold={{ duration: rm ? 0 : 400 }}
    >
      <button
        bind:this={closeEl}
        type="button"
        class={cn(
          CONTROL_BUTTON,
          "absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-md border border-border/70 bg-background/85 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        )}
        aria-label="Close"
        onclick={() => onclose?.()}
      >
        ×
      </button>
      <div class="min-h-0 flex-1 overflow-auto p-6">{@render children?.()}</div>
    </div>
  </div>
{/if}
