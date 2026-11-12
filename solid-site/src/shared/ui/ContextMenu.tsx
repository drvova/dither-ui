import { For, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { cn } from "@dither-kit/tailwind/lib"
import { focusFirstMenuItem, menuKeydown } from "@/shared/lib/menu"

export type MenuItem = {
  label?: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export type ContextMenuProps = { x: number; y: number; items: MenuItem[]; onClose?: () => void }

export default function ContextMenu(props: ContextMenuProps) {
  function run(it: MenuItem) {
    if (it.disabled || it.divider) return
    it.onClick?.()
    props.onClose?.()
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") props.onClose?.()
  }
  const close = () => props.onClose?.()
  let root: HTMLDivElement | undefined

  onMount(() => {
    queueMicrotask(() => focusFirstMenuItem(root ?? null))
    // defer so the opening click doesn't immediately close it
    const listen = setTimeout(() => {
      window.addEventListener("pointerdown", close)
      window.addEventListener("keydown", onKey)
      window.addEventListener("blur", close)
    }, 0)
    onCleanup(() => {
      clearTimeout(listen)
      window.removeEventListener("pointerdown", close)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("blur", close)
    })
  })

  return (
    <Portal>
      <div
        ref={(el) => (root = el)}
        role="menu"
        aria-orientation="vertical"
        on:keydown={menuKeydown}
        class="fixed z-[100] min-w-[172px] rim rounded-2xl bg-card p-1 font-mono text-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
        style={{ left: `${props.x}px`, top: `${props.y}px` }}
        on:pointerdown={(e) => e.stopPropagation()}
        on:contextmenu={(e) => e.preventDefault()}
      >
        <For each={props.items}>
          {(it) => (
            <Show when={!it.divider} fallback={<div role="separator" class="my-1 h-px bg-border" />}>
              <button
                type="button"
                role="menuitem"
                disabled={it.disabled}
                class={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
                  it.danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-background",
                )}
                onClick={() => run(it)}
              >
                {it.label}
              </button>
            </Show>
          )}
        </For>
      </div>
    </Portal>
  )
}
