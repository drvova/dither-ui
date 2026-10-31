// Hearing a reel's score in the Studio: the cut synthesized by the kit's
// score engine and played once from the top through Web Audio (playback
// only: the samples are the kit's, the same the video export carries).
import type { ReelModel } from "@/entities/widget"
import { scoreCut } from "@dither-kit"
import { scorePlanOf } from "./reel"

/** The preview's audio, opened in the click that asks for it, or null where
 * the browser has no audio: iOS WebKit starts a context made outside a
 * gesture suspended, and the synthesis takes longer than a gesture lasts. */
export function openScoreAudio(): AudioContext | null {
  const Ctx = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  const ctx = new Ctx()
  void ctx.resume()
  return ctx
}

/** Synthesize the cut and play it once through `ctx`; returns a stop, which
 * also closes `ctx`. */
export function playScore(reel: ReelModel, ctx: AudioContext, onEnd: () => void): () => void {
  const audio = scoreCut(scorePlanOf(reel))
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
