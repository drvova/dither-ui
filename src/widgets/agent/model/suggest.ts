// What to ask next, after a turn: a few follow-ups the Studio can propose
// from the frames the turn touched (or, when it changed none, the frames
// in hand), each something the harness can do with the Studio's tools
// (evolve, get the code, export a video, cut a reel). Pure.
import type { Changed } from "./steps"

/** At most this many. */
export const NEXT_MAX = 3
const NAME_MAX = 24

const named = (f: Changed) => (f.name.length > NAME_MAX ? `${f.name.slice(0, NAME_MAX - 1).trimEnd()}…` : f.name)

/** Names in a sentence: "A", "A and B", "A, B and 2 more". */
function list(frames: Changed[]) {
  const shown = frames.slice(0, 2).map(named)
  const rest = frames.length - shown.length
  if (rest > 0) return `${shown.join(", ")} and ${rest} more`
  return shown.join(" and ")
}

export function nextPrompts(frames: readonly Changed[]): string[] {
  if (!frames.length) return []
  const [first] = frames
  const out =
    frames.length === 1
      ? [
          `Evolve ${named(first)} into four variants`,
          `Show the code for ${named(first)}`,
          `Export ${named(first)} as a video`,
        ]
      : [
          `Cut ${list([...frames])} into a reel`,
          `Evolve ${named(first)} into four variants`,
          `Show the code for ${named(first)}`,
        ]
  return out.slice(0, NEXT_MAX)
}
