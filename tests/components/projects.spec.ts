// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { editor } from "../../src/entities/editor"
import {
  activeProjectId,
  createProject,
  deleteProject,
  hydrate,
  projects,
  renameProject,
  switchProject,
} from "../../src/features/persistence"

// The persistence module is a singleton over the editor singleton — these run
// as one sequential story, resetting storage (not module state) between steps.
beforeEach(() => {
  // no localStorage.clear(): later steps build on earlier ones deliberately
})

describe("project workspace (sequential story)", () => {
  it("migrates the legacy single-document key into the first project", () => {
    localStorage.clear()
    localStorage.setItem(
      "dither-studio-v8",
      JSON.stringify({
        artboards: [
          {
            id: "legacy1", name: "Legacy chart", x: 0, y: 0, w: 520, h: 360,
            hidden: false, locked: false, groupId: null, chart: { type: "bar" },
          },
        ],
        groups: [],
      })
    )
    hydrate()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe("My project")
    expect(editor.artboards[0].name).toBe("Legacy chart")
    expect(editor.artboards[0].chart.type).toBe("bar")
    // legacy key consumed
    expect(localStorage.getItem("dither-studio-v8")).toBeNull()
  })

  it("createProject starts a fresh isolated document", () => {
    const before = editor.artboards.map((a) => a.id)
    createProject("Second")
    expect(projects).toHaveLength(2)
    expect(activeProjectId.value).toBe(projects[1].id)
    // fresh default doc, not the legacy artboards
    expect(editor.artboards.map((a) => a.id)).not.toEqual(before)
    expect(editor.artboards).toHaveLength(1)
  })

  it("switching back restores the first project's work untouched", () => {
    switchProject(projects[0].id)
    expect(editor.artboards[0].name).toBe("Legacy chart")
    switchProject(projects[1].id)
    expect(editor.artboards[0].name).not.toBe("Legacy chart")
  })

  it("rename persists to the index", () => {
    renameProject(projects[1].id, "Renamed")
    expect(projects[1].name).toBe("Renamed")
    const idx = JSON.parse(localStorage.getItem("dither-studio-projects")!)
    expect(idx[1].name).toBe("Renamed")
  })

  it("deleting the active project falls back to the remaining one", () => {
    deleteProject(projects[1].id)
    expect(projects).toHaveLength(1)
    expect(activeProjectId.value).toBe(projects[0].id)
    expect(editor.artboards[0].name).toBe("Legacy chart")
  })

  it("deleting the last project recreates a fresh default workspace", () => {
    deleteProject(projects[0].id)
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe("My project")
    expect(editor.artboards).toHaveLength(1)
  })
})
