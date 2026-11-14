// One list of where a Chromium stands. The tasks package keeps it
// (`chromiumCandidates`) for the post-build, the walk, the recorders and the
// site's browser specs; the Discord service, which imports nothing of the
// workspace, keeps a copy, read here from its source and run against the
// original on every platform's environment, so the two never drift.
import { readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"
import { chromiumCandidates, chromiumPath, findChromium } from "@dither-ui/tasks"

const service = readFileSync(new URL("../packages/discord/src/service.mjs", import.meta.url), "utf8")
const copy = service.match(/\nfunction chromiumCandidates\(env = process\.env\) \{\n[\s\S]*?\n\}\n/)?.[0]

const ENVS: Record<string, string | undefined>[] = [
  {},
  { CHROME_PATH: "/opt/chrome" },
  { ProgramFiles: "D:\\Apps", "ProgramFiles(x86)": "D:\\Apps86", LOCALAPPDATA: "C:\\Users\\a\\AppData\\Local" },
  { CHROME_PATH: "C:\\chrome.exe", LOCALAPPDATA: "" },
]

describe("the Chromium a task drives", () => {
  it("is looked for in one order: CHROME_PATH, the standard installs, then Playwright's folder", () => {
    const list = chromiumCandidates({})
    expect(list[0]).toBe("/usr/bin/google-chrome")
    expect(list).toContain("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    expect(list).toContain("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
    expect(list.at(-1)).toBe("/opt/pw-browsers/chromium")
    expect(chromiumCandidates({ CHROME_PATH: "/opt/chrome" })[0]).toBe("/opt/chrome")
    expect(chromiumPath({}, () => false)).toBeUndefined()
    expect(chromiumPath({}, (p) => p.endsWith("msedge.exe"))).toBe(
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    )
    expect(() => findChromium({}, () => false)).toThrow(/no chromium found/)
  })

  it("is the same list in the Discord service, on every platform's environment", () => {
    expect(copy, "service.mjs keeps its chromiumCandidates").toBeDefined()
    const theirs = new Function("process", `${copy}\nreturn chromiumCandidates`)({ env: {} }) as (
      env: Record<string, string | undefined>,
    ) => string[]
    for (const env of ENVS) expect(theirs(env)).toEqual(chromiumCandidates(env))
    // and it launches the first of them that stands, never a path of its own
    expect(service).toMatch(/chromiumCandidates\(\)\.find\(/)
    expect(service).not.toMatch(/executablePath: "/)
  })
})
