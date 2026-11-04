// @rstest-environment jsdom
import { beforeEach, describe, expect, it } from "rstack/test"
import { editor } from "../../src/entities/editor"
import {
  activeProjectId,
  createProject,
  deleteProject,
  duplicateProject,
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
            id: "legacy1",
            name: "Legacy chart",
            x: 0,
            y: 0,
            w: 520,
            h: 360,
            hidden: false,
            locked: false,
            groupId: null,
            chart: { type: "bar" },
          },
        ],
        groups: [],
      }),
    )
    // A kept document is no fresh one: nothing to centre once mounted.
    expect(hydrate()).toBe(false)
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe("My project")
    expect(editor.artboards[0].name).toBe("Legacy chart")
    expect(editor.artboards[0].chart.type).toBe("bar")
    // legacy key consumed
    expect(localStorage.getItem("dither-studio-v8")).toBeNull()
  })
  it("rehydrates without duplicating project metadata", () => {
    hydrate()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe("My project")
  })

  it("createProject starts a fresh isolated document", () => {
    const before = editor.artboards.map((a) => a.id)
    createProject("Second")
    expect(projects).toHaveLength(2)
    expect(activeProjectId.value).toBe(projects[1].id)
    // fresh default doc, not the legacy artboards
    expect(editor.artboards.map((a) => a.id)).not.toEqual(before)
    expect(editor.artboards).toHaveLength(1)
    expect(editor.artboards[0].name).toBe("Area chart")
    expect(editor.artboards[0].x).not.toBe(0)
    expect(editor.artboards[0].y).not.toBe(0)
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

  it("duplicating a project copies its work beside it and opens the copy", () => {
    const [first] = projects
    duplicateProject(first.id)
    expect(projects.map((p) => p.name)).toEqual([first.name, `${first.name} copy`, "Renamed"])
    expect(activeProjectId.value).toBe(projects[1].id)
    expect(editor.artboards[0].name).toBe("Legacy chart")
    const idx = JSON.parse(localStorage.getItem("dither-studio-projects")!)
    expect(idx).toHaveLength(3)
    deleteProject(projects[1].id)
    expect(activeProjectId.value).toBe(projects[0].id)
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
    expect(editor.artboards[0].x).not.toBe(0)
    expect(editor.artboards[0].y).not.toBe(0)
  })

  it("says when a first visit got the fresh document, so the page can centre it", () => {
    localStorage.clear()
    expect(hydrate()).toBe(true)
    expect(editor.artboards).toHaveLength(1)
  })
})
