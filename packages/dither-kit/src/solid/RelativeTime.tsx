import { createMemo, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { cn } from "../tailwind/lib"

export type RelativeTimeProps = {
  date: Date | string | number
  locale?: string
  auto?: boolean
  now?: number
  updateInterval?: number
  class?: string
}

/** "3 minutes ago" / "in 2 days" through Intl.RelativeTimeFormat — the unit
 * ladder picks the largest sane unit, `numeric: "auto"` turns zero into
 * "now". `auto` re-ticks on an interval (a non-zero updateInterval makes
 * itself a second tick); pass `now` for a frozen, testable clock. */
export default function RelativeTime(raw: RelativeTimeProps) {
  const props = mergeProps({ locale: "en-US", auto: true, updateInterval: 30_000 }, raw)

  const [tick, setTick] = createSignal(0)
  let timer: ReturnType<typeof setInterval> | null = null

  // The timer starts in the browser only: a server render must leave none.
  onMount(() => {
    if (props.auto && props.now === undefined && props.updateInterval > 0) {
      timer = setInterval(() => setTick((n) => n + 1), props.updateInterval)
    }
  })
  onCleanup(() => {
    if (timer) clearInterval(timer)
  })

  const text = createMemo(() => {
    void tick() // timer ticks re-run the format
    const target = new Date(props.date).getTime()
    const now = props.now ?? Date.now()
    const diffMs = target - now // negative = past, positive = future
    const sgn = Math.sign(diffMs)
    const abs = Math.abs(diffMs)
    const sec = abs / 1000
    const min = sec / 60
    const hr = min / 60
    const day = hr / 24
    const week = day / 7
    const month = day / 30.44
    const year = day / 365.25

    let value: number
    let unit: Intl.RelativeTimeFormatUnit
    if (sec < 45) [value, unit] = [Math.round(sgn * sec), "second"]
    else if (min < 45) [value, unit] = [Math.round(sgn * min), "minute"]
    else if (hr < 22) [value, unit] = [Math.round(sgn * hr), "hour"]
    else if (day < 6) [value, unit] = [Math.round(sgn * day), "day"]
    else if (week < 4) [value, unit] = [Math.round(sgn * week), "week"]
    else if (month < 11) [value, unit] = [Math.round(sgn * month), "month"]
    else [value, unit] = [Math.round(sgn * year), "year"]

    return new Intl.RelativeTimeFormat(props.locale, { numeric: "auto" }).format(value, unit)
  })

  return <time class={cn(props.class)}>{text()}</time>
}
