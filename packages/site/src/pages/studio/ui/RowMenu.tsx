// A sidebar row's "more" key and its menu: a real menu (focus on its first
// item, arrows between items, Escape or a press outside closes it and hands
// focus back to the key). The row's own actions are its items.
import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import { focusFirstMenuItem, menuKeydown } from "@/shared/lib"
import "./RowMenu.css"

/** One item of a row's menu. */
export type RowAction = { label: string; run: () => void; danger?: boolean; disabled?: boolean }

export default function RowMenu(props: { label: string; actions: RowAction[] }) {
  const [open, setOpen] = createSignal(false)
  let key: HTMLButtonElement | undefined
  let menu: HTMLDivElement | undefined

  function close(refocus = true) {
    setOpen(false)
    if (refocus) queueMicrotask(() => key?.focus())
  }
  function run(a: RowAction) {
    close(false)
    a.run()
  }
  function onDown(e: PointerEvent) {
    const t = e.target as Node
    if (!menu?.contains(t) && !key?.contains(t)) close(false)
  }
  createEffect(
    on(
      open,
      (v) => {
        if (v) {
          queueMicrotask(() => focusFirstMenuItem(menu ?? null))
          window.addEventListener("pointerdown", onDown, true)
        } else window.removeEventListener("pointerdown", onDown, true)
      },
      { defer: true },
    ),
  )
  onCleanup(() => typeof window !== "undefined" && window.removeEventListener("pointerdown", onDown, true))

  return (
    <div class="row-menu-scope row-menu" classList={{ "is-open": open() }}>
      <button
        ref={(el) => (key = el)}
        type="button"
        class="more"
        aria-label={props.label}
        title={props.label}
        aria-haspopup="menu"
        aria-expanded={open()}
        // heard on the key itself, so the press stops here
        on:click={(e) => {
          e.stopPropagation()
          setOpen(!open())
        }}
      >
        <DitherIcon name="MoreHorizontal" size={14} strokeWidth={1.5} />
      </button>
      <Show when={open()}>
        <div
          ref={(el) => (menu = el)}
          role="menu"
          aria-label={props.label}
          class="menu rim"
          on:keydown={(e) => {
            menuKeydown(e)
            if (e.key !== "Escape") return
            e.stopPropagation()
            e.preventDefault()
            close()
          }}
        >
          <For each={props.actions}>
            {(a) => (
              <button
                type="button"
                role="menuitem"
                class="item"
                classList={{ "is-danger": a.danger }}
                disabled={a.disabled}
                onClick={() => run(a)}
              >
                {a.label}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
