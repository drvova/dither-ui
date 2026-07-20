<script lang="ts">
  import { fade } from "svelte/transition"
  import DitherButton from "./DitherButton.svelte"
  import { CONTROL_BUTTON } from "./control"
  import { cn } from "./lib"
  import { portal } from "./portal"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    onconfirm?: () => void
    oncancel?: () => void
  }
  let {
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onconfirm,
    oncancel,
  }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  let panelEl = $state<HTMLElement | null>(null)
  let cancelEl = $state<HTMLButtonElement | null>(null)

  const focusable = () => [
    ...(panelEl?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []),
  ]
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      oncancel?.()
      return
    }
    if (e.key !== "Tab") return
    const items = focusable()
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  // Panel mount = open (focus cancel); destroy = close (restore focus).
  function alertFocus(_node: HTMLElement) {
    const previousFocus = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => cancelEl?.focus())
    return {
      destroy() {
        previousFocus?.focus()
      },
    }
  }
</script>

{#if open}
  <div
    use:portal
    role="alertdialog"
    tabindex="-1"
    aria-modal="true"
    aria-label={title}
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6"
    transition:fade={{ duration: rm ? 0 : 160 }}
    onpointerdown={(e) => {
      if (e.target === e.currentTarget) oncancel?.()
    }}
    onkeydown={onKeydown}
  >
    <div
      bind:this={panelEl}
      use:alertFocus
      class="w-full max-w-md rounded-xl border border-border/80 bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
    >
      <div class="px-4 pt-4">
        <span class="text-sm font-medium">{title}</span>
        {#if description}
          <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        {/if}
      </div>
      <div class="flex justify-end gap-2 p-4">
        <button
          bind:this={cancelEl}
          type="button"
          class={cn(
            CONTROL_BUTTON,
            "min-h-10 rounded-md border border-border px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          )}
          onclick={() => oncancel?.()}
        >
          {cancelLabel}
        </button>
        <DitherButton color={danger ? "red" : "blue"} onclick={() => onconfirm?.()}>
          {confirmLabel}
        </DitherButton>
      </div>
    </div>
  </div>
{/if}
