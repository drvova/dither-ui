// The close's heat painted off the main thread (`heat-offload.ts`): a paint
// shows the worker's latest frame and asks for the one due at the next
// paint; the first paint, and every paint without a worker, paints here.
import { describe, expect, it } from "rstack/test"
import { BAYER4, fillOf } from "@dither-ui/kit/engine/pixel.ts"
import { createRasterBuffer } from "@dither-ui/kit/engine/raster.ts"
import { CLOSE, paintHeat } from "../src/pages/landing/heat"
import { answerHeat, type HeatAsk } from "../src/pages/landing/heat-ask"
import { offloadHeat } from "../src/pages/landing/heat-offload"
import { RAMP } from "../src/pages/landing/plate"

const INKS = RAMP.map(fillOf)
const COLS = 1440 / CLOSE.cell
const ROWS = 640 / CLOSE.cell
const at = (time: number) => {
  const b = createRasterBuffer(COLS, ROWS)
  paintHeat(b, time, null, CLOSE.cell, INKS, BAYER4)
  return b.data
}

/** A worker that answers when told to, as the real one does. */
function fakeWorker() {
  const asks: HeatAsk[] = []
  const worker = {
    onmessage: null as ((e: MessageEvent) => void) | null,
    postMessage: (ask: HeatAsk) => void asks.push(ask),
    terminate() {},
  }
  return {
    worker: worker as unknown as Worker,
    asks,
    answer() {
      const ask = asks.shift()!
      worker.onmessage?.({ data: answerHeat(ask) } as MessageEvent)
    },
  }
}

describe("the close off the main thread", () => {
  it("paints the first frame here, then shows the frame it asked the worker for", () => {
    const fake = fakeWorker()
    const offload = offloadHeat(() => fake.worker)
    const b = createRasterBuffer(COLS, ROWS)
    offload.paint(b, 0, 0.1, null, INKS, BAYER4)
    expect(b.data).toEqual(at(0))
    expect(fake.asks.map((a) => a.time)).toEqual([0.1])
    // the worker answers: the next paint shows the moment it asked for
    fake.answer()
    offload.paint(b, 0.1, 0.2, null, INKS, BAYER4)
    expect(b.data).toEqual(at(0.1))
    // one ask in flight at a time: a paint before the answer asks for nothing
    offload.paint(b, 0.2, 0.3, null, INKS, BAYER4)
    expect(fake.asks.map((a) => a.time)).toEqual([0.2])
  })

  it("paints every frame here without a worker", () => {
    const offload = offloadHeat(() => null)
    const b = createRasterBuffer(COLS, ROWS)
    for (const t of [0, 0.5, 1]) {
      offload.paint(b, t, t + 0.1, null, INKS, BAYER4)
      expect(b.data).toEqual(at(t))
    }
  })

  it("paints here again when the band's size changed under a frame in flight", () => {
    const fake = fakeWorker()
    const offload = offloadHeat(() => fake.worker)
    offload.paint(createRasterBuffer(COLS, ROWS), 0, 0.1, null, INKS, BAYER4)
    fake.answer()
    const wider = createRasterBuffer(COLS + 10, ROWS)
    offload.paint(wider, 0.1, 0.2, null, INKS, BAYER4)
    const ref = createRasterBuffer(COLS + 10, ROWS)
    paintHeat(ref, 0.1, null, CLOSE.cell, INKS, BAYER4)
    expect(wider.data).toEqual(ref.data)
  })
})
