import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { COMPONENT_COUNT, RUNTIME_DEPS } from "../src/pages/landing/facts"

const index = readFileSync(new URL("../dither-kit/index.ts", import.meta.url), "utf8")
const components = [...index.matchAll(/default as (\w+)/g)].map((m) => m[1])
const kit = JSON.parse(readFileSync(new URL("../dither-kit/package.json", import.meta.url), "utf8")) as {
  peerDependencies: Record<string, string>
}

describe("landing facts", () => {
  it("counts the kit's public Dither components", () => {
    expect(COMPONENT_COUNT).toBe(components.filter((n) => n.startsWith("Dither")).length)
  })

  it("names every package the kit needs beside Vue", () => {
    const peers = Object.keys(kit.peerDependencies).filter((p) => p !== "vue")
    expect([...RUNTIME_DEPS].sort()).toEqual(peers.sort())
  })
})
