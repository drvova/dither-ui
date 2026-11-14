// The string protocols the site shares with what stands outside it, each
// under one name: the localStorage keys (`STORAGE_KEYS`, `STORAGE_PREFIXES`),
// the player's page (`STAGE_ID`, `DOCUMENT_SCRIPT_ID`) and the surfaces a
// page answers on `window` (`og`, the card renderer's; `ditherStudio`, the
// mounted Studio's). The tasks and the Discord service may not import the
// site (the package order), so what they say of these is a pinned copy,
// held here to the site's own.
import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import type { OgWindow, StudioWindow } from "@dither-ui/tasks"
import { agentConfig, SITE_STORAGE } from "@dither-ui/tasks/site-storage"
import { loadAgentConfig } from "@/features/agent/tools"
import { DOCUMENT_SCRIPT_ID, STAGE_ID } from "@/shared/config/player"
import { STORAGE_KEYS, STORAGE_PREFIXES } from "@/shared/config/storage"

const PACKAGES = join(import.meta.dirname, "../../..")
const SRC = join(PACKAGES, "site/src")
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(tsx?|mjs|js)$/.test(e.name) ? [join(dir, e.name)] : [],
  )
const text = (file: string) => readFileSync(file, "utf8")
/** Every file of the site's source but the one that names the strings. */
const named = (owner: string) => walk(SRC).filter((f) => relative(SRC, f) !== owner)
const literal = (s: string) => new RegExp(`["'\`]${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)

describe("the localStorage keys", () => {
  const every = [...Object.values(STORAGE_KEYS), ...Object.values(STORAGE_PREFIXES)]

  it("are each one key, written once: no module of the site spells one", () => {
    expect(new Set(every).size).toBe(every.length)
    const spelled = named("shared/config/storage.ts").flatMap((f) =>
      every.filter((k) => literal(k).test(text(f))).map((k) => `${relative(SRC, f)}: ${k}`),
    )
    expect(spelled).toEqual([])
  })

  it("are the ones the tasks write, by the same names", () => {
    for (const [name, key] of Object.entries(SITE_STORAGE))
      expect(key, name).toBe(STORAGE_KEYS[name as keyof typeof STORAGE_KEYS])
    const tasks = walk(join(PACKAGES, "tasks/src")).filter((f) => !f.endsWith("site-storage.mjs"))
    const spelled = tasks.flatMap((f) => every.filter((k) => literal(k).test(text(f))).map((k) => `${f}: ${k}`))
    expect(spelled).toEqual([])
  })

  it("hold the agent demo's saved harness as the panel reads it", () => {
    const config = agentConfig("ws://127.0.0.1:7777", "claude")
    localStorage.setItem(SITE_STORAGE.agentConfig, JSON.stringify(config))
    expect(loadAgentConfig()).toEqual(config)
    localStorage.removeItem(SITE_STORAGE.agentConfig)
  })
})

describe("the player's page", () => {
  it("is named once: the composition writes and the player reads these ids, no other spelling", () => {
    const spelled = named("shared/config/player.ts").flatMap((f) =>
      [STAGE_ID, DOCUMENT_SCRIPT_ID]
        .filter((id) => literal(id).test(text(f)))
        .map((id) => `${relative(SRC, f)}: ${id}`),
    )
    expect(spelled).toEqual([])
    // the frame renderer waits for the stage the player mounts in
    expect(text(join(PACKAGES, "tasks/src/render-frames.mjs"))).toContain(`#${STAGE_ID}`)
  })
})

describe("the surfaces a page answers on window", () => {
  // Every member of the card renderer's surface, by the site's own type: a
  // member added or renamed there is a type error here.
  const OG: Record<keyof Window["og"], true> = { ready: true, card: true, ids: true, files: true }

  it("answer what the tasks restate: the site's types satisfy theirs", () => {
    const og: OgWindow["og"] = {} as Window["og"]
    const studio: StudioWindow["ditherStudio"] = undefined as Window["ditherStudio"]
    expect([og, studio]).toHaveLength(2)
  })

  it("are called by the tasks and the Discord service only by members they have", () => {
    const calls = [join(PACKAGES, "tasks/src/cards.ts"), join(PACKAGES, "discord/src/service.mjs")].flatMap((f) =>
      [...text(f).matchAll(/\.og\.(\w+)\(/g)].map((m) => m[1]),
    )
    expect(calls).toContain("files")
    expect(calls.filter((c) => !(c in OG))).toEqual([])
  })
})
