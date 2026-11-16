import { createMemo, createSignal, Index, mergeProps, onCleanup, onMount, Show } from "solid-js"
import { formatFixed } from "../engine/format-number"
import { latestEntry } from "../engine/visibility"
import { cn } from "../tailwind/lib"
import "./CountUp.css"

export type CountUpProps = {
  /** @default required */
  to: number
  from?: number
  /** @docs number (ms) */
  duration?: number
  decimals?: number
  /** @default undefined */
  class?: string
}

/** The turns a column rolls at most past its own digit: enough to read as
 * counting, few enough to stay a short column. */
const MAX_TURNS = 3

/** One place of the figure: its character, and for a digit the column of
 * 0-9 it rolls on, `rows` long, from row `start` to row `end` (a
 * separator's `rows` is 0: it stands). */
export type CountPlace = { char: string; rows: number; start: number; end: number }

/** The figure `to` as places, each digit's column rolling from where `from`
 * stands at that place, as many turns as the count passes through it
 * (at most `MAX_TURNS`), up or down. */
export function countPlaces(from: number, to: number, decimals: number): CountPlace[] {
  const end = formatFixed(to, decimals)
  const startDigits = formatFixed(from, decimals).replace(/\D/g, "")
  const digits = end.replace(/\D/g, "").length
  const up = to >= from
  let place = 0
  return [...end].map((char): CountPlace => {
    if (!/\d/.test(char)) return { char, rows: 0, start: 0, end: 0 }
    const p = digits - 1 - place // places from the right
    const fromDigit = Number(startDigits[startDigits.length - 1 - p] ?? 0)
    place++
    const span = Math.abs(to - from) * 10 ** decimals
    const turns = Math.min(MAX_TURNS, Math.floor(span / 10 ** (p + 1)))
    const endDigit = Number(char)
    let start = up ? fromDigit : 10 * turns + fromDigit
    let stop = up ? 10 * turns + endDigit : endDigit
    if (up && stop < start) stop += 10
    if (!up && start < stop) start += 10
    return { char, rows: 10 * Math.ceil((Math.max(start, stop) + 1) / 10), start, end: stop }
  })
}

/** A count from `from` to `to` that runs once it is seen: each digit an
 * odometer column rolling on an ease-out over `duration` (`CountUp.css`),
 * so the kit clock holds it when directed. Reduced motion shows the end. */
export default function CountUp(raw: CountUpProps) {
  const props = mergeProps({ from: 0, duration: 1500, decimals: 0 }, raw)

  let el: HTMLSpanElement | undefined
  const [run, setRun] = createSignal(false)
  const places = createMemo(() => countPlaces(props.from, props.to, props.decimals))

  onMount(() => {
    if (typeof IntersectionObserver === "undefined") return void setRun(true)
    const io = new IntersectionObserver((entries) => {
      if (!latestEntry(entries)?.isIntersecting) return
      setRun(true)
      io.disconnect()
    })
    if (el) io.observe(el)
    onCleanup(() => io.disconnect())
  })

  return (
    <span
      ref={(node) => (el = node)}
      class={cn("dk-count-up inline-flex tabular-nums", props.class)}
      data-count={run() ? "run" : "wait"}
      style={{ "--dk-count-dur": `${Math.max(1, props.duration)}ms` }}
    >
      <span class="sr-only">{formatFixed(props.to, props.decimals)}</span>
      <Index each={places()}>
        {(place) => (
          <Show when={place().rows} fallback={<span aria-hidden="true">{place().char}</span>}>
            <span aria-hidden="true" class="dk-count-cell">
              <span
                class="dk-count-column"
                style={{ "--dk-start": String(place().start), "--dk-end": String(place().end) }}
              >
                {Array.from({ length: place().rows }, (_, r) => r % 10).join("\n")}
              </span>
            </span>
          </Show>
        )}
      </Index>
    </span>
  )
}
