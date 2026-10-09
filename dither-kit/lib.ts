import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Tailwind-aware className combiner — local copy so the chart pack is
 * self-contained and portable as a registry. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Copy text with the async clipboard where it exists (a secure context and a
 * user gesture), else through the legacy selection path, so a copy action
 * works on plain http, in older engines and in automation: true when the
 * text was copied.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // denied, no gesture, or an insecure context: the selection path follows
  }
  if (typeof document === "undefined" || !document.body) return false
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.setAttribute("aria-hidden", "true")
  area.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0"
  document.body.appendChild(area)
  area.select()
  let copied: boolean
  try {
    copied = document.execCommand("copy")
  } catch {
    copied = false
  }
  area.remove()
  return copied
}
