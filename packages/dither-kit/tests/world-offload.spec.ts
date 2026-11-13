// A world painted off the main thread (`world-offload.ts`, `world-ask.ts`):
// the worker's moment is the page's to the byte, whole or mid-build; the
// model crosses once, not every frame; the first paint, and every paint
// without a worker or after it failed, is painted here.
import { describe, expect, it } from "rstack/test"
import { createAssembly } from "../src/engine/assemble"
import { BAYER4 } from "../src/engine/pixel"
import { createRasterBuffer } from "../src/engine/raster"
import { parseWorld } from "../src/engine/models"
import {
  cameraOf,
  createWorldTarget,
  paintTarget,
  rasterizeWorld,
  sampleWorld,
  type World,
  type WorldStyle,
  type WorldView,
} from "../src/engine/world"
import { answerWorld, type WorldAsk, worldDesk } from "../src/engine/world-ask"
import { offloadWorld, type WorldMoment } from "../src/engine/world-offload"

const STYLE: WorldStyle = { fill: [228, 225, 216], matrix: BAYER4, shade: 0.3, material: true, wire: true, fog: 0.2 }
const VIEW: WorldView = { yaw: 30, pitch: 15, zoom: 1, fov: 40 }
const HEAT: [number, number, number] = [255, 120, 40]
const W = 96
const H = 64

/** The moment painted here, as `DitherWorld` paints it. */
function here(world: World, view: WorldView, state: WorldMoment["state"]) {
  const b = createRasterBuffer(W, H)
  const w = state ? createAssembly(world, HEAT, 3).frame(view, cameraOf(world, view, W, H), state, 1 / 30) : world
  const t = createWorldTarget(W, H)
  rasterizeWorld(w, view, t, STYLE)
  paintTarget(b, t, w, view, STYLE)
  return b.data
}

function fakeWorker() {
  const desk = worldDesk()
  const asks: WorldAsk[] = []
  const worker = {
    onmessage: null as ((e: MessageEvent) => void) | null,
    onerror: null as (() => void) | null,
    postMessage: (ask: WorldAsk) => void asks.push(structuredClone(ask)),
    terminate() {},
  }
  return {
    worker,
    asks,
    answer: () => worker.onmessage?.({ data: answerWorld(desk, asks.shift()!) } as MessageEvent),
  }
}

describe("a world off the main thread", () => {
  const world = parseWorld(sampleWorld(2), "vrml")
  const moment = (view: WorldView, state: WorldMoment["state"] = null): WorldMoment => ({
    world,
    view,
    state,
    heat: HEAT,
    seed: 3,
    dt: 1 / 30,
    style: STYLE,
  })

  it("paints the worker's moment to the byte, whole and mid-build", () => {
    for (const state of [null, { build: 0.4, scatter: 0, nudge: null }]) {
      const fake = fakeWorker()
      const offload = offloadWorld(() => fake.worker as unknown as Worker)
      const b = createRasterBuffer(W, H)
      let painted = 0
      const next = { ...VIEW, yaw: 40 }
      offload.paint(b, moment(next, state), () => void painted++)
      // the first paint is the page's; the ask goes out for the next moment
      expect(painted).toBe(1)
      fake.answer()
      offload.paint(b, moment({ ...VIEW, yaw: 50 }, state), () => void painted++)
      expect(painted).toBe(1)
      expect(b.data).toEqual(here(world, next, state))
    }
  })

  it("hands the model over once, not with every moment", () => {
    const fake = fakeWorker()
    const offload = offloadWorld(() => fake.worker as unknown as Worker)
    const b = createRasterBuffer(W, H)
    for (let i = 0; i < 3; i++) {
      offload.paint(b, moment({ ...VIEW, yaw: i }), () => {})
      fake.answer()
    }
    const sent: boolean[] = []
    const post = fake.worker.postMessage
    fake.worker.postMessage = (ask: WorldAsk) => (sent.push(!!ask.world), post(ask))
    offload.paint(b, moment({ ...VIEW, yaw: 9 }), () => {})
    expect(sent).toEqual([false])
  })

  it("paints here for good once the worker fails", () => {
    const fake = fakeWorker()
    const offload = offloadWorld(() => fake.worker as unknown as Worker)
    const b = createRasterBuffer(W, H)
    let painted = 0
    offload.paint(b, moment(VIEW), () => void painted++)
    fake.answer()
    fake.worker.onerror?.()
    offload.paint(b, moment(VIEW), () => void painted++)
    offload.paint(b, moment(VIEW), () => void painted++)
    expect(painted).toBe(3)
  })
})
