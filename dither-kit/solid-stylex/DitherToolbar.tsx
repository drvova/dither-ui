// Generated from ../solid/DitherToolbar.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, onMount } from "solid-js"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 50%, transparent)",
    padding: "0.25rem",
  },
})

export type DitherToolbarProps = { label?: string; children?: JSX.Element }

export default function DitherToolbar(props: DitherToolbarProps) {
  let root: HTMLDivElement | undefined

  function buttons(): HTMLElement[] {
    return Array.from(root?.querySelectorAll<HTMLElement>("button") ?? [])
  }

  function setStops(active: HTMLElement) {
    for (const b of buttons()) b.tabIndex = b === active ? 0 : -1
  }

  onMount(() => {
    buttons().forEach((b, i) => (b.tabIndex = i === 0 ? 0 : -1))
  })

  function onKeydown(e: KeyboardEvent) {
    const btns = buttons()
    if (!btns.length) return
    const i = btns.indexOf(e.target as HTMLElement)
    let next: number
    if (e.key === "ArrowRight") next = (i + 1 + btns.length) % btns.length
    else if (e.key === "ArrowLeft") next = (i - 1 + btns.length) % btns.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = btns.length - 1
    else return
    e.preventDefault()
    e.stopPropagation()
    setStops(btns[next])
    btns[next].focus()
  }

  return (
    // A native listener: an arrow it takes must stop here, not at the page.
    <div
      ref={(el) => (root = el)}
      role="toolbar"
      aria-label={props.label}
      {...stylex.props(styles.row)}
      on:keydown={onKeydown}
    >
      {props.children}
    </div>
  )
}
