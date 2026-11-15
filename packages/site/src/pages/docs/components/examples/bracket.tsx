import { createSignal } from "solid-js"
import { DitherBracket } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  type Pairing = { a: string; b: string; winner?: "a" | "b" }

  const [rounds, setRounds] = createSignal<Pairing[][]>([
    [
      { a: "Bayer", b: "Ordered" },
      { a: "Halftone", b: "Threshold" },
    ],
    [{ a: "TBD", b: "TBD" }],
  ])

  // you own the data: the winner advances into the next round
  function pick(r: number, m: number, side: "a" | "b") {
    const next = rounds().map((round) => round.map((match) => ({ ...match })))
    const match = next[r][m]
    match.winner = side
    const ahead = next[r + 1]?.[Math.floor(m / 2)]
    if (ahead) ahead[m % 2 === 0 ? "a" : "b"] = match[side]
    setRounds(next)
  }

  return <DitherBracket rounds={rounds()} interactive color="green" onPick={pick} />
}

export const meta = defineExample({
  component: DitherBracket,
  title: "Bracket",
  studio: {
    group: "display",
    frame: { w: 420, h: 260 },
    story: { teams: { kind: "list", demo: ["Bayer", "Ordered", "Halftone", "Threshold"] } },
    controls: { color: { demo: "blue" }, interactive: { demo: false } },
  },
})
