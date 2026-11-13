// Module-level toast store: `DitherToaster` renders it, `toast()` feeds it.

import { createStore, produce } from "solid-js/store"
import type { PixelColor } from "../../engine/pixel"

export type Toast = {
  id: number
  message: string
  color: PixelColor
  duration: number
}

let uid = 0
const [toasts, setToasts] = createStore<Toast[]>([])
export { toasts }
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function dismiss(id: number): void {
  const timer = timers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    timers.delete(id)
  }
  setToasts((list) => list.filter((t) => t.id !== id))
}

export function toast(message: string, opts?: { color?: PixelColor; duration?: number }): number {
  const id = ++uid
  const duration = opts?.duration ?? 3500
  setToasts(produce((list) => void list.push({ id, message, color: opts?.color ?? "blue", duration })))
  timers.set(
    id,
    setTimeout(() => dismiss(id), duration),
  )
  return id
}
