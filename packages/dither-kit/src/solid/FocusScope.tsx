import { type JSX, mergeProps, onCleanup, onMount, splitProps } from "solid-js"
import { isTab } from "../engine/keys"
import { cn } from "../tailwind/lib"

type Own = {
  autofocus?: boolean
  trapped?: boolean
  restoreFocus?: boolean
  class?: string
}

export type FocusScopeProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Rendered, so focus can land on it: neither it nor an ancestor inside the
 * scope is `display: none`, and it is not `visibility: hidden`. A control
 * hidden by CSS can never be a Tab endpoint, or Tab from the last visible
 * one would leave the scope. */
function rendered(el: HTMLElement, scope: HTMLElement): boolean {
  if (getComputedStyle(el).visibility === "hidden") return false
  for (let n: HTMLElement | null = el; n && n !== scope; n = n.parentElement)
    if (getComputedStyle(n).display === "none") return false
  return true
}

/** Focus management for overlays and popovers:
 * `autofocus` moves focus into the scope on mount (first focusable, else the
 * scope itself), `trapped` keeps Tab/Shift+Tab cycling inside it, and
 * `restoreFocus` hands focus back to whatever had it before — the a11y
 * contract every modal in this kit already obeys. */
export default function FocusScope(raw: FocusScopeProps) {
  const merged = mergeProps({ autofocus: true, trapped: true, restoreFocus: true }, raw)
  const [props, rest] = splitProps(merged, ["autofocus", "trapped", "restoreFocus", "class", "children"])

  let root: HTMLDivElement | undefined
  let previous: HTMLElement | null = null

  function focusables(): HTMLElement[] {
    const scope = root
    if (!scope) return []
    return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => !el.closest("[hidden]") && el.getAttribute("aria-hidden") !== "true" && rendered(el, scope),
    )
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!props.trapped || !isTab(event) || !root) return
    const items = focusables()
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null
    const inside = active instanceof HTMLElement && root.contains(active)

    if (event.shiftKey) {
      if (!inside || active === first) {
        event.preventDefault()
        last.focus()
      }
    } else if (!inside || active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  onMount(() => {
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Heard on the element itself, never through Solid's delegation: a key
    // pressed in a portal opened from inside this scope (a nested drawer)
    // must not reach this trap, as it does not in the page's own tree.
    const scope = root
    scope?.addEventListener("keydown", onKeyDown)
    if (props.autofocus) {
      queueMicrotask(() => {
        const items = focusables()
        if (items.length > 0) items[0].focus()
        else root?.focus()
      })
    }
    onCleanup(() => {
      scope?.removeEventListener("keydown", onKeyDown)
      if (props.restoreFocus && previous && previous.isConnected) previous.focus()
    })
  })

  return (
    <div {...rest} ref={(el) => (root = el)} tabindex="-1" class={cn("", props.class)}>
      {props.children}
    </div>
  )
}
