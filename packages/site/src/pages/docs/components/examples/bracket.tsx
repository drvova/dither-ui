import { createStore, produce } from "solid-js/store"
import { DitherBracket, type BracketMatch } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [rounds, setRounds] = createStore<BracketMatch[][]>([
    [
      { a: "Bayer", b: "Ordered" },
      { a: "Halftone", b: "Threshold" },
    ],
    [{ a: "TBD", b: "TBD" }],
  ])
  // you own the data: the winner advances into the next round
  function pick(r: number, m: number, side: "a" | "b") {
    setRounds(
      produce((rounds) => {
        const match = rounds[r][m]
        match.winner = side
        const winner = side === "a" ? match.a : match.b
        const next = rounds[r + 1]?.[Math.floor(m / 2)]
        if (next) {
          if (m % 2 === 0) next.a = winner
          else next.b = winner
        }
      }),
    )
  }
  function reset() {
    setRounds(
      produce((rounds) => {
        rounds[0].forEach((m) => delete m.winner)
        rounds[1][0] = { a: "TBD", b: "TBD" }
      }),
    )
  }

  return (
    <div class="grid justify-items-center gap-3">
      {/* Centred while it fits; on the narrowest phones it scrolls. */}
      <div class="w-full overflow-x-auto">
        <div class="mx-auto w-max">
          <DitherBracket rounds={rounds} interactive color="green" onPick={pick} />
        </div>
      </div>
      <button
        type="button"
        class="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        onClick={reset}
      >
        Reset bracket
      </button>
    </div>
  )
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
