/** Browser storage, best-effort everywhere: a private window, a locked-down
 * or automation profile, or a full quota throws on access (even on reading
 * `localStorage` itself), and the page keeps working in memory. Every read
 * and write of localStorage in the app goes through here. */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Blocked or full: the value lives for the visit only.
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Nothing to forget where nothing is kept.
    }
  },
}

/** A stored JSON value, or null when absent or unreadable. It is still
 * `unknown`: the caller parses it into its type. */
export function readJson(key: string): unknown {
  const raw = storage.get(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const writeJson = (key: string, value: unknown): void => storage.set(key, JSON.stringify(value))
