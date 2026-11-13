// The install box's command: a long path wraps after its slashes on a
// phone, never at a hyphen and never in the middle of a piece (it ran
// under the Copy key at 390px, and "dither-" broke from "ui").
import { expect, it } from "rstack/test"
import { commandPieces } from "../src/pages/landing/command"

it("breaks a path only after its slashes, and keeps every word whole", () => {
  const cmd = "npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit"
  const words = commandPieces(cmd)
  expect(words).toEqual([
    ["npx"],
    ["degit"],
    ["drvova/", "dither-ui/", "packages/", "dither-kit/", "src"],
    ["src/", "dither-kit"],
  ])
  // the pieces put back are the command, character for character
  expect(words.map((w) => w.join("")).join(" ")).toBe(cmd)
  // no piece is broken at a hyphen
  for (const w of words) for (const p of w) expect(p.endsWith("-")).toBe(false)
  expect(commandPieces("npm i clsx d3-scale")).toEqual([["npm"], ["i"], ["clsx"], ["d3-scale"]])
})
