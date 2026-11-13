// The close's heat worker (`heat-ask.ts`, spawned by `heat-offload.ts`): paints each frame the page
// asks for into the pixels it was handed and hands them straight back.
import { answerHeat, type HeatAsk } from "./heat-ask"

self.onmessage = (e: MessageEvent<HeatAsk>) => {
  const done = answerHeat(e.data)
  ;(self as unknown as Worker).postMessage(done, [done.pixels])
}
