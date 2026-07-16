// @vitest-environment jsdom
import { nextTick } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"
import { editor } from "../../src/entities/editor"
import {
  activeProjectId,
  hydrate,
  startAutosave,
  stopAutosave,
} from "../../src/features/persistence"

afterEach(() => {
  stopAutosave()
  vi.useRealTimers()
  localStorage.clear()
})

describe("studio autosave", () => {
  it("persists viewport changes without document edits", async () => {
    vi.useFakeTimers()
    localStorage.clear()
    hydrate()
    startAutosave()

    editor.viewport.x = 123
    editor.viewport.y = 45
    editor.viewport.zoom = 1.5
    await nextTick()
    vi.advanceTimersByTime(401)

    const raw = localStorage.getItem(`dither-studio-doc-${activeProjectId.value}`)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).viewport).toEqual({ x: 123, y: 45, zoom: 1.5 })
  })
})
