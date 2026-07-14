// Module-level toast store — DitherToaster.vue renders it, toast() feeds it.

import { reactive } from "vue"
import type { PixelColor } from "./pixel"

export type Toast = {
  id: number
  message: string
  color: PixelColor
  duration: number
}

let uid = 0
export const toasts = reactive<Toast[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function dismiss(id: number): void {
  const timer = timers.get(id)
  if (timer !== undefined) {
    clearTimeout(timer)
    timers.delete(id)
  }
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}

export function toast(
  message: string,
  opts?: { color?: PixelColor; duration?: number }
): number {
  const id = ++uid
  const duration = opts?.duration ?? 3500
  toasts.push({ id, message, color: opts?.color ?? "blue", duration })
  timers.set(
    id,
    setTimeout(() => dismiss(id), duration)
  )
  return id
}
