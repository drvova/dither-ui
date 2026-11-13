// Responsive: the same preview rendered again in frames of fixed container
// widths, side by side. Kit components size from their container (and
// container units), so each frame shows the layout at that width; the
// frames share the preview's state and are inert copies (one live preview
// keeps the focus order and ids). Fit scales the row into view; 1:1 scrolls.
import { createMemo, createSignal, For, type JSX, onCleanup, onMount } from "solid-js"
import { ICONS } from "@/widgets/workbench/model/tools"
import { useBench } from "../context"
import Icon from "./Icon"
import "./Responsive.css"

const PRESETS = [320, 375, 768, 1024, 1280]
const GAP = 16

export default function Responsive(props: { render?: () => JSX.Element }) {
  const b = useBench()
  const [widths, setWidths] = createSignal([320, 768, 1280])
  const [fit, setFit] = createSignal(true)
  const [custom, setCustom] = createSignal(480)
  let row: HTMLDivElement | undefined
  const [room, setRoom] = createSignal(0)
  const [heights, setHeights] = createSignal<Record<number, number>>({})

  let ro: ResizeObserver | null = null
  onMount(() => {
    if (typeof ResizeObserver === "undefined" || !row) return
    ro = new ResizeObserver(() => {
      setRoom(row?.clientWidth ?? 0)
      const next: Record<number, number> = {}
      row?.querySelectorAll<HTMLElement>("[data-frame]").forEach((el) => (next[+el.dataset.frame!] = el.offsetHeight))
      setHeights(next)
    })
    ro.observe(row)
    row.querySelectorAll("[data-frame]").forEach((el) => ro!.observe(el))
    onCleanup(() => ro?.disconnect())
  })

  const scale = createMemo(() => {
    if (!fit() || !room()) return 1
    const total = widths().reduce((s, w) => s + w, 0) + GAP * (widths().length - 1)
    return Math.min(1, room() / total)
  })

  function toggle(w: number) {
    setWidths(widths().includes(w) ? widths().filter((x) => x !== w) : [...widths(), w].sort((x, y) => x - y))
    setTimeout(() => row?.querySelectorAll("[data-frame]").forEach((el) => ro?.observe(el)))
  }

  function add() {
    const w = Math.min(2560, Math.max(160, Math.round(custom())))
    if (!widths().includes(w)) toggle(w)
    b.say(`${w} px frame`)
  }

  return (
    <section class="wb-responsive responsive-scope" aria-label="Responsive frames">
      <header class="row">
        <span class="micro">Responsive</span>
        <span class="dim">the preview at container widths</span>
        <span class="spacer" />
        <div class="seg" role="group" aria-label="Frame widths">
          <For each={PRESETS}>
            {(w) => (
              <button type="button" aria-pressed={widths().includes(w)} onClick={() => toggle(w)}>
                {w}
              </button>
            )}
          </For>
        </div>
        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <label class="num">
            <input
              value={custom()}
              type="number"
              min="160"
              max="2560"
              aria-label="Custom width in px"
              onInput={(e) => setCustom(+e.currentTarget.value)}
            />{" "}
            px
          </label>
          <button type="submit" class="act">
            Add
          </button>
        </form>
        <div class="seg" role="group" aria-label="Scale">
          <button type="button" aria-pressed={fit()} onClick={() => setFit(true)}>
            fit
          </button>
          <button type="button" aria-pressed={!fit()} onClick={() => setFit(false)}>
            1:1
          </button>
        </div>
        <button type="button" class="act" aria-label="Close responsive frames" onClick={() => b.toggle("responsive")}>
          <Icon d={ICONS.close} size={12} />
        </button>
      </header>
      <div ref={(el) => (row = el)} class={fit() ? "frames" : "frames scroll"}>
        <For each={widths()}>
          {(w) => (
            <figure
              class="frame"
              style={{
                width: `${w * scale()}px`,
                height: heights()[w] ? `${heights()[w] * scale() + 18}px` : undefined,
              }}
            >
              <figcaption class="micro">{w} px</figcaption>
              <div
                class="inner"
                data-frame={w}
                style={{ width: `${w}px`, transform: `scale(${scale()})` }}
                inert
                aria-hidden="true"
              >
                {/* The slot rendered again: one fresh tree per frame. */}
                {props.render?.()}
              </div>
            </figure>
          )}
        </For>
      </div>
    </section>
  )
}
