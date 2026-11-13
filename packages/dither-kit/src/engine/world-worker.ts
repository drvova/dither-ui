// A world's worker (`world-ask.ts`, spawned by `world-offload.ts`): paints
// each moment the page asks for into the pixels it was handed, and hands
// them straight back.
import { answerWorld, type WorldAsk, worldDesk } from "./world-ask"

const desk = worldDesk()
self.onmessage = (e: MessageEvent<WorldAsk>) => {
  const done = answerWorld(desk, e.data)
  ;(self as unknown as Worker).postMessage(done, [done.pixels])
}
