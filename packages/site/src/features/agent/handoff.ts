// What the canvas hands the agent: frames picked on the canvas for the next
// message, and messages asked at the selection. The canvas writes it, the
// agent panel reads it, the Studio page opens the panel when a message
// waits. Imported by path (`features/agent/handoff`), so the canvas never
// pulls the agent's protocol into its chunk.
import { createMutable } from "solid-js/store"

export type Ask = { text: string; frames: string[] }

export const handoff = createMutable({
  /** Picking: a click on a frame hands it to the agent instead of selecting it. */
  picking: false,
  /** The frames handed over for the next message, in the order picked. */
  picked: [] as string[],
  /** Messages asked on the canvas, waiting for the panel to send them. */
  asks: [] as Ask[],
})

/** A frame handed over, or taken back if it already was. */
export function togglePicked(id: string) {
  const at = handoff.picked.indexOf(id)
  if (at === -1) handoff.picked.push(id)
  else handoff.picked.splice(at, 1)
}

/** A message for the agent about some frames; blank text asks nothing. */
export function askAgent(text: string, frames: string[]) {
  const said = text.trim()
  if (said) handoff.asks.push({ text: said, frames: [...frames] })
}

/** The oldest waiting message, taken off the queue. */
export const takeAsk = (): Ask | undefined => handoff.asks.shift()
