// The Chromium a task drives: `CHROME_PATH` first, then a standard install
// (Linux, macOS, Windows: Chrome, then Edge, both Chromium), then the
// browsers folder Playwright's images keep. The post-build, the walk, the
// frame renderer, the agent demo and the site's browser specs all find it
// here. The Discord service, which imports nothing of the workspace, keeps a
// copy of `chromiumCandidates`, held to this one by the workspace's
// `tests/chromium.spec.ts`.
import { statSync } from "node:fs"

type Env = Record<string, string | undefined>

/** Where a Chromium may stand, in the order it is looked for. */
export function chromiumCandidates(env: Env = process.env): string[] {
  const programFiles = env["ProgramFiles"] ?? "C:\\Program Files"
  const programFilesX86 = env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)"
  const localAppData = env["LOCALAPPDATA"] ?? ""
  return [
    env["CHROME_PATH"] ?? "",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    localAppData ? `${localAppData}\\Google\\Chrome\\Application\\chrome.exe` : "",
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    "/opt/pw-browsers/chromium",
  ].filter((p) => p !== "")
}

const isFile = (path: string) => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

/** The first Chromium that stands, or undefined: a task that can fall back
 * (Playwright's own build) or names one by flag asks this. */
export function chromiumPath(env: Env = process.env, exists: (path: string) => boolean = isFile): string | undefined {
  return chromiumCandidates(env).find((p) => exists(p))
}

/** The Chromium a build draws with. A build with none fails here rather
 * than ship without its cards. */
export function findChromium(env: Env = process.env, exists: (path: string) => boolean = isFile): string {
  const found = chromiumPath(env, exists)
  if (!found) throw new Error("no chromium found. Set CHROME_PATH or install one of: google-chrome, chromium.")
  return found
}
