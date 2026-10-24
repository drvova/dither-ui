// Hearing a reel's score in the Studio: the cut synthesized by the kit's
// score engine and played once from the top through Web Audio (playback
// only: the samples are the kit's, the same the video export carries).
// Returns a stop, or null where the browser has no audio.
import type { ReelModel } from "@/entities/widget"
import { scoreCut } from "@dither-kit"
import { scorePlanOf } from "./reel"

export function playScore(reel: ReelModel, onEnd: () => void): (() => void) | null {
  const Ctx = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  const audio = scoreCut(scorePlanOf(reel))
  const ctx = new Ctx()
  const buffer = ctx.createBuffer(2, audio.left.length, audio.sampleRate)
  buffer.getChannelData(0).set(audio.left)
  buffer.getChannelData(1).set(audio.right)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  let done = false
  const stop = () => {
    if (done) return
    done = true
    source.onended = null
    try {
      source.stop()
    } catch {
      // already ended
    }
    void ctx.close()
    onEnd()
  }
  source.onended = stop
  source.start()
  return stop
}
