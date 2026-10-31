// Interface sounds, after Kobra's: small WebAudio voices — no audio files —
// for the moments a press changes something: a switch going on or off, a tap
// on a tab or a tool, a copy, the theme, a panel folding. One AudioContext,
// made by the first sound (always inside the gesture that asked for it);
// `sounds` is the reader's switch, remembered across visits, and nothing
// plays while it is off.
import { ref, watch } from "vue"
import { storage } from "./storage"

export type Cue = "on" | "off" | "tap" | "copy" | "theme" | "fold" | "unfold"

/** One oscillator: a pitch (gliding exponentially to `to` over `glide`), a
 * linear attack to `gain`, an exponential decay toward `floor` (time
 * constant `decay`), an optional release and lowpass. Times in seconds,
 * from the voice's start (`at`). */
export interface Voice {
  type: OscillatorType
  from: number
  to?: number
  glide?: number
  gain: number
  attack: number
  decay: number
  floor?: number
  release?: number
  releaseTau?: number
  at?: number
  stop: number
  lowpass?: number
}

export const CUES: Record<Cue, Voice[]> = {
  on: [{ type: "sine", from: 520, to: 880, glide: 0.087, gain: 0.147, attack: 0.002, decay: 0.028, stop: 0.167 }],
  off: [{ type: "sine", from: 780, to: 420, glide: 0.087, gain: 0.127, attack: 0.002, decay: 0.028, stop: 0.187 }],
  tap: [{ type: "triangle", from: 900, to: 780, glide: 0.056, gain: 0.12, attack: 0.001, decay: 0.018, stop: 0.156 }],
  copy: [
    { type: "sine", from: 1200, gain: 0.077, attack: 0, decay: 0.005, stop: 0.121 },
    { type: "sine", from: 1400, gain: 0.068, attack: 0, decay: 0.005, at: 0.04, stop: 0.121 },
  ],
  // A rising fifth, C5 then G5, held a breath then released.
  theme: [
    {
      type: "triangle",
      from: 523.25,
      gain: 0.064,
      attack: 0.008,
      decay: 0.1,
      floor: 0.002,
      release: 0.308,
      releaseTau: 0.04,
      stop: 0.528,
    },
    {
      type: "triangle",
      from: 783.99,
      gain: 0.055,
      attack: 0.008,
      decay: 0.1,
      floor: 0.002,
      release: 0.308,
      releaseTau: 0.04,
      at: 0.12,
      stop: 0.528,
    },
  ],
  fold: [
    {
      type: "triangle",
      from: 560,
      to: 300,
      glide: 0.114,
      gain: 0.103,
      attack: 0.004,
      decay: 0.037,
      stop: 0.214,
      lowpass: 2200,
    },
  ],
  unfold: [
    {
      type: "triangle",
      from: 300,
      to: 560,
      glide: 0.114,
      gain: 0.103,
      attack: 0.004,
      decay: 0.037,
      stop: 0.214,
      lowpass: 2200,
    },
  ],
}

const KEY = "dither-sounds"

/** The reader's switch for interface sounds (on unless they turned it off). */
export const sounds = ref(storage.get(KEY) !== "off")

watch(sounds, (on) => storage.set(KEY, on ? "on" : "off"))

let ctx: AudioContext | null = null

/** Schedule one cue's voices on a context; `jitter` (0..1) varies each
 * voice's level by up to ±8%, so a run of taps never sounds stamped. */
export function schedule(audio: BaseAudioContext, cue: Cue, jitter = Math.random): void {
  const now = audio.currentTime
  for (const v of CUES[cue]) {
    const t = now + (v.at ?? 0)
    const osc = audio.createOscillator()
    const amp = audio.createGain()
    osc.type = v.type
    osc.frequency.setValueAtTime(v.from, t)
    if (v.to) osc.frequency.exponentialRampToValueAtTime(v.to, t + (v.glide ?? 0.05))
    const peak = v.gain * (0.92 + jitter() * 0.16)
    amp.gain.setValueAtTime(v.attack ? 0 : peak, t)
    if (v.attack) amp.gain.linearRampToValueAtTime(peak, t + v.attack)
    amp.gain.setTargetAtTime(v.floor ?? 0, t + v.attack, v.decay)
    if (v.release) amp.gain.setTargetAtTime(0, t + v.release, v.releaseTau ?? 0.04)
    let out: AudioNode = amp
    if (v.lowpass) {
      const lp = audio.createBiquadFilter()
      lp.type = "lowpass"
      lp.frequency.setValueAtTime(v.lowpass, t)
      amp.connect(lp)
      out = lp
    }
    osc.connect(amp)
    out.connect(audio.destination)
    osc.onended = () => {
      osc.disconnect()
      out.disconnect()
      if (out !== amp) amp.disconnect()
    }
    osc.start(t)
    osc.stop(t + v.stop)
  }
}

/** Play a cue — nothing while sounds are off or where WebAudio is missing. */
export function play(cue: Cue): void {
  if (!sounds.value || typeof AudioContext === "undefined") return
  try {
    ctx ??= new AudioContext()
    // WebKit also parks a context "interrupted" (a call, the app in the
    // background); anything but running resumes on the next cue.
    if (ctx.state !== "running") void ctx.resume()
    schedule(ctx, cue)
  } catch {
    // an engine that refuses audio (autoplay policy, no output device) stays silent
  }
}
