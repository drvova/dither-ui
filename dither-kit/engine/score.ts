// The score: a film's soundtrack synthesized from its cut, sample by sample,
// in plain arithmetic. No Web Audio and no clock: the plan and its seed are
// the only inputs, so the same cut sounds the same on every render (the
// clock's rule, heard). A plan is a list of moments: where each clip begins
// (a chord change, a riser into it, an impact on it), where a chapter turns
// (an interface blip) and where a callout lands (a tick). The music: a pad
// that changes chord on every clip and resolves to the major on the last,
// the Bayer 4x4 itself as the arpeggio (its sixteen ranks pick the notes,
// its grid restarting on every cut), a pulse that builds as the film goes
// on, an echo and a hall. `wavBytes` writes 16-bit PCM with triangular
// dither. Pure and DOM-free.
import { mulberry32 } from "./noise"

export type ScorePlan = {
  /** Length in seconds. */
  seconds: number
  /** Where each clip begins, in seconds (the first at 0). */
  clips: number[]
  /** Where a chapter turns: an interface blip. */
  marks?: number[]
  /** Small events, such as a callout landing: a tick. */
  ticks?: number[]
  seed?: number
  /** Samples per second, 44100 by default. */
  sampleRate?: number
}

export type ScoreAudio = { sampleRate: number; left: Float32Array; right: Float32Array }

/** The house Bayer 4x4 in reading order: the motif's sixteen steps. */
const MOTIF = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
/** Chord progressions in D (MIDI notes, the bass first); the seed picks one. */
const PROGRESSIONS = [
  [
    [38, 57, 64, 69],
    [34, 50, 53, 57, 62],
    [43, 50, 58, 62, 65],
    [38, 53, 57, 60, 64],
    [34, 53, 57, 60, 62],
    [41, 57, 60, 64, 67],
    [36, 55, 60, 62, 64],
    [33, 52, 57, 62, 64],
  ],
  [
    [38, 53, 57, 62, 64],
    [41, 57, 60, 64, 67],
    [34, 50, 53, 57, 62],
    [36, 55, 60, 62, 64],
    [43, 50, 58, 62, 65],
    [33, 52, 57, 61, 64],
  ],
]
/** The last clip resolves to D major. */
const RESOLVE = [38, 54, 57, 62, 66, 69]

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12)

/** The arpeggio's eight notes: the chord above the bass, raised past D4, stacked an octave up. */
function tones(chord: number[]): number[] {
  const up = [
    ...new Set(
      chord.slice(1).map((m) => {
        while (m < 62) m += 12
        while (m > 74) m -= 12
        return m
      }),
    ),
  ].sort((a, b) => a - b)
  const out: number[] = []
  for (let o = 0; out.length < 8; o += 12) for (const m of up) if (out.length < 8) out.push(m + o)
  return out
}

export function scoreCut(plan: ScorePlan): ScoreAudio {
  const SR = Math.max(4000, Math.round(plan.sampleRate ?? 44100))
  const seconds = Math.max(0.1, plan.seconds)
  const N = Math.ceil(seconds * SR)
  const rnd = mulberry32(((plan.seed ?? 1) ^ 0x5eed) >>> 0)
  const len = (s: number) => Math.max(1, Math.round(s * SR))
  const pair = () => [new Float32Array(N), new Float32Array(N)] as const
  const dry = pair()
  const duck = pair() // pad and bass, pumped by the kick
  const verb = pair()
  const echo = pair()
  const kickEnv = new Float32Array(N)

  type Send = { pan?: number; gain?: number; rev?: number; del?: number; bus?: readonly [Float32Array, Float32Array] }
  function put(t0: number, sig: Float32Array, { pan = 0, gain = 1, rev = 0, del = 0, bus = dry }: Send = {}) {
    const i0 = Math.round(t0 * SR)
    const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain
    const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain
    for (let j = Math.max(0, -i0); j < sig.length && i0 + j < N; j++) {
      const i = i0 + j
      const v = sig[j]
      bus[0][i] += v * gl
      bus[1][i] += v * gr
      if (rev) ((verb[0][i] += v * gl * rev), (verb[1][i] += v * gr * rev))
      if (del) ((echo[0][i] += v * gl * del), (echo[1][i] += v * gr * del))
    }
  }

  // Oscillators (band-limited by polyBLEP), noise, a state-variable filter.
  const blep = (t: number, dt: number) =>
    t < dt ? ((t /= dt), t + t - t * t - 1) : t > 1 - dt ? ((t = (t - 1) / dt), t * t + t + t + 1) : 0
  function saw(freq: number, n: number) {
    const out = new Float32Array(n)
    const dt = freq / SR
    let p = rnd()
    for (let j = 0; j < n; j++) {
      out[j] = 2 * p - 1 - blep(p, dt)
      if ((p += dt) >= 1) p -= 1
    }
    return out
  }
  /** A pulse of width `w`, its DC removed. */
  function pulse(freq: number, n: number, w = 0.3) {
    const out = new Float32Array(n)
    const dt = freq / SR
    let p = 0
    for (let j = 0; j < n; j++) {
      out[j] = (p < w ? 1 : -1) + blep(p, dt) - blep((p + 1 - w) % 1, dt) + 1 - 2 * w
      if ((p += dt) >= 1) p -= 1
    }
    return out
  }
  function sine(freq: number | ((t: number) => number), n: number) {
    const out = new Float32Array(n)
    let p = 0
    for (let j = 0; j < n; j++) {
      out[j] = Math.sin(p)
      p += (2 * Math.PI * (typeof freq === "number" ? freq : freq(j / SR))) / SR
    }
    return out
  }
  function noise(n: number) {
    const out = new Float32Array(n)
    for (let j = 0; j < n; j++) out[j] = rnd() * 2 - 1
    return out
  }
  function svf(
    sig: Float32Array,
    cutoff: number | ((t: number) => number),
    q = 0.707,
    mode: "lp" | "bp" | "hp" = "lp",
  ) {
    const out = new Float32Array(sig.length)
    const k = 1 / q
    let ic1 = 0
    let ic2 = 0
    let g = 0
    for (let j = 0; j < sig.length; j++) {
      if (j === 0 || (typeof cutoff === "function" && j % 16 === 0)) {
        const fc = typeof cutoff === "function" ? cutoff(j / SR) : cutoff
        g = Math.tan((Math.PI * Math.min(Math.max(fc, 20), SR * 0.45)) / SR)
      }
      const a1 = 1 / (1 + g * (g + k))
      const a2 = g * a1
      const v3 = sig[j] - ic2
      const v1 = a1 * ic1 + a2 * v3
      const v2 = ic2 + a2 * ic1 + g * a2 * v3
      ic1 = 2 * v1 - ic1
      ic2 = 2 * v2 - ic2
      out[j] = mode === "lp" ? v2 : mode === "bp" ? v1 : sig[j] - k * v1 - v2
    }
    return out
  }
  function shape(sig: Float32Array, fn: (t: number) => number) {
    for (let j = 0; j < sig.length; j++) sig[j] *= fn(j / SR)
    return sig
  }
  function mix(a: Float32Array, b: Float32Array, gb = 1) {
    for (let j = 0; j < Math.min(a.length, b.length); j++) a[j] += b[j] * gb
    return a
  }
  /** The house rule, heard: hold every `hold`th sample, keep a few levels. */
  function crush(sig: Float32Array, hold: number, levels: number) {
    let v = 0
    for (let j = 0; j < sig.length; j++) {
      if (j % hold === 0) v = Math.round(sig[j] * levels) / levels
      sig[j] = v
    }
    return sig
  }
  const edge = (t: number, n: number, a = 0.003, r = 0.01) => Math.min(1, t / a, Math.max(0, (n / SR - t) / r))

  // The voices.
  function pluck(t: number, m: number, gain: number, cut: number, pan: number, decay = 12) {
    const n = len(0.5)
    const v = svf(pulse(mtof(m), n), (u) => 500 + cut * Math.exp(-u * 18), 0.9)
    shape(v, (u) => Math.min(1, u / 0.002) * Math.exp(-u * decay))
    put(t, svf(crush(v, Math.max(1, Math.round(SR / 11025)), 28), 7500, 0.6), { pan, gain, rev: 0.3, del: 0.3 })
  }
  function blip(t: number, gain = 0.05, root = 86) {
    ;[root, root + 7].forEach((m, k) => {
      const n = len(0.05)
      const v = svf(crush(pulse(mtof(m), n, 0.5), 3, 8), 7000, 0.6)
      put(
        t + k * 0.045,
        shape(v, (u) => edge(u, n, 0.001, 0.02) * Math.exp(-u * 30)),
        { gain, pan: 0.1, rev: 0.2, del: 0.15 },
      )
    })
  }
  function kick(t: number, gain: number) {
    const n = len(0.5)
    const v = new Float32Array(n)
    let p = 0
    for (let j = 0; j < n; j++) {
      const u = j / SR
      p += (2 * Math.PI * (44 + 90 * Math.exp(-u * 32))) / SR
      v[j] = Math.tanh(1.8 * Math.sin(p) * Math.exp(-u * 7)) + (rnd() * 2 - 1) * 0.12 * Math.exp(-u * 500)
    }
    put(t, v, { gain })
    const i0 = Math.round(t * SR)
    for (let j = 0; j < len(0.32) && i0 + j < N; j++)
      if (i0 + j >= 0) kickEnv[i0 + j] = Math.max(kickEnv[i0 + j], Math.exp((-j / SR) * 9))
  }
  function hat(t: number, gain: number, pan: number) {
    put(
      t,
      shape(svf(noise(len(0.07)), 8500, 0.7, "hp"), (u) => Math.exp(-u * 85)),
      { gain, pan, rev: 0.1 },
    )
  }
  function riser(end: number, dur: number, gain: number) {
    const n = len(dur)
    const v = mix(
      svf(noise(n), (u) => 250 * 28 ** (u / dur), 2.2, "bp"),
      sine((u) => 180 * 4 ** (u / dur), n),
      0.15,
    )
    put(
      end - dur,
      shape(v, (u) => (u / dur) ** 2.4 * edge(u, n, 0.01, 0.012)),
      { gain, rev: 0.25 },
    )
  }
  function impact(t: number, big: boolean) {
    const n = len(big ? 3.2 : 1.6)
    const boom = new Float32Array(n)
    let p = 0
    for (let j = 0; j < n; j++) {
      const u = j / SR
      p += (2 * Math.PI * (36 + 70 * Math.exp(-u * 16))) / SR
      boom[j] = Math.tanh(2.2 * Math.sin(p)) * Math.exp(-u * (big ? 1.5 : 2.8))
    }
    put(t, boom, { gain: big ? 0.42 : 0.3 })
    const crash = svf(noise(n), (u) => 900 + 5200 * Math.exp(-u * 3), 0.6)
    put(
      t,
      shape(crash, (u) => Math.min(1, u / 0.003) * Math.exp(-u * (big ? 2.4 : 6))),
      { gain: big ? 0.24 : 0.12, rev: 0.6 },
    )
  }
  function wipe(t: number, dur: number, gain: number) {
    const n = len(dur)
    const v = crush(
      svf(noise(n), (u) => 6000 - 4500 * (u / dur), 1.2, "bp"),
      6,
      10,
    )
    put(
      t,
      svf(
        shape(v, (u) => Math.sin((Math.PI * u) / dur) ** 2),
        9000,
        0.6,
      ),
      { gain, rev: 0.3 },
    )
  }

  // The cut as sections, one per clip.
  const starts = [...new Set([0, ...plan.clips.filter((t) => t > 0 && t < seconds)])].sort((a, b) => a - b)
  const sections = starts.map((t0, k) => ({ t0, t1: starts[k + 1] ?? seconds }))
  const n = sections.length
  const progression = PROGRESSIONS[Math.floor(rnd() * PROGRESSIONS.length)]
  const chordOf = (k: number) => (k === n - 1 && n > 1 ? RESOLVE : progression[k % progression.length])
  const energyOf = (k: number) => (n === 1 ? 0.7 : k === n - 1 ? 0.85 : 0.45 + (0.55 * k) / (n - 1))

  sections.forEach(({ t0, t1 }, k) => {
    const chord = chordOf(k)
    const e = energyOf(k)
    const last = k === n - 1
    const attack = k === 0 ? Math.min(2.2, (t1 - t0) / 2) : 0.4
    const release = last ? 0.01 : 1.2
    const span = t1 - t0 + release
    const nn = len(span)
    const tail = (u: number) => (last ? Math.max(0, Math.min(1, (seconds - t0 - u) / Math.min(3, t1 - t0))) : 1)
    const env = (u: number) => Math.min(1, u / attack) * Math.min(1, Math.max(0, (span - u) / release)) * tail(u)
    // The pad: two detuned saws a note, closing and opening with the energy.
    chord.slice(1).forEach((m, i) => {
      for (const [d, pan] of [
        [-9, -0.6],
        [9, 0.6],
      ]) {
        const v = svf(
          saw(mtof(m) * 2 ** (d / 1200), nn),
          (u) => (450 + 2300 * e) * (1 + 0.1 * Math.sin((t0 + u) * 0.9 + i)),
          0.8,
        )
        put(t0, shape(v, env), { pan, gain: 0.05 * e, rev: 0.35, bus: duck })
      }
    })
    // The bass, with a second harmonic so a phone hears it.
    const root = mtof(chord[0])
    put(t0, shape(mix(sine(root, nn), sine(root * 2, nn), 0.25), env), { gain: 0.07 * e, bus: duck })
    // The motif over the first clip, one note a cell, the way the matrix lights.
    if (k === 0 && t1 - t0 >= 2) {
      const tn = tones(chord)
      for (let rank = 0; rank < 16; rank++) {
        const cell = MOTIF.indexOf(rank)
        pluck(
          t0 + 0.6 + rank / 15,
          tn[cell >> 1] + (rank > 11 ? 12 : 0),
          0.04 + rank * 0.0015,
          3200,
          ((cell % 4) / 3) * 1.2 - 0.6,
          9,
        )
      }
    }
    // The arpeggio, its grid restarting on the cut.
    if (k > 0 || n === 1) {
      const tn = tones(chord)
      const step = e > 0.55 ? 0.125 : 0.25
      const from = k === 0 ? t0 + (t1 - t0) * 0.25 : t0 + 0.05
      for (let s = 0, t = from; t < t1 - 0.02; s++, t = from + s * step)
        pluck(
          t,
          tn[MOTIF[s % 16] >> 1],
          0.1 * (0.5 + 0.5 * e) * (s % 4 ? 0.9 : 1.15),
          2000 + 2800 * e,
          s % 2 ? 0.35 : -0.35,
        )
    }
    // The pulse: a kick on the beat, then offbeat hats, never under the last clip.
    if (e >= 0.7 && !last)
      for (let s = 0, t = t0 + 0.05; t < t1 - 0.05; s++, t = t0 + 0.05 + s * 0.25) {
        if (s % 2 === 0) kick(t, 0.24)
        if (e >= 0.82 && s % 2 === 1) hat(t, 0.04, s % 4 === 1 ? 0.3 : -0.3)
      }
    // Into the clip: a riser, an impact, the dither wipe, the panel's blip.
    if (k > 0) {
      riser(t0 + 0.02, Math.min(last ? 1.4 : 0.8, (t0 - sections[k - 1].t0) * 0.5), last ? 0.14 : 0.08)
      impact(t0 + 0.03, last)
      wipe(t0 + 0.02, 0.4, 0.03)
      blip(t0 + 0.14)
    }
    // The last clip lands: the motif once more, slowly.
    if (last && n > 1) {
      const tn = tones(chord)
      for (let s = 0; s < 16 && t0 + 1 + s * 0.25 < seconds - 0.5; s++)
        pluck(t0 + 1 + s * 0.25, tn[MOTIF[s] >> 1], 0.045 * (1 - s / 22), 2600, s % 2 ? 0.4 : -0.4, 7)
    }
  })
  for (const t of plan.marks ?? []) if (t > 0 && t < seconds) blip(t, 0.026)
  for (const t of plan.ticks ?? []) if (t >= 0 && t < seconds) blip(t, 0.02, 98)

  // Sends: a ping-pong echo of three sixteenths, then a hall (Freeverb's).
  const D = len(0.375)
  const yl = new Float32Array(N)
  const yr = new Float32Array(N)
  let lpl = 0
  let lpr = 0
  for (let i = 0; i < N; i++) {
    lpl += 0.35 * ((i >= D ? echo[0][i - D] + 0.38 * yr[i - D] : 0) - lpl)
    lpr += 0.35 * ((i >= D ? echo[1][i - D] + 0.38 * yl[i - D] : 0) - lpr)
    yl[i] = lpl
    yr[i] = lpr
    dry[0][i] += yl[i] * 0.5
    dry[1][i] += yr[i] * 0.5
    verb[0][i] += yl[i] * 0.2
    verb[1][i] += yr[i] * 0.2
  }
  function hall(input: Float32Array, spread: number) {
    const k = SR / 44100
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({
      buf: new Float32Array(Math.max(1, Math.round((d + spread) * k))),
      i: 0,
      f: 0,
    }))
    const alls = [556, 441, 341, 225].map((d) => ({
      buf: new Float32Array(Math.max(1, Math.round((d + spread) * k))),
      i: 0,
    }))
    const out = new Float32Array(N)
    for (let j = 0; j < N; j++) {
      const x = input[j] * 0.015
      let s = 0
      for (const c of combs) {
        const y = c.buf[c.i]
        c.f = y * 0.7 + c.f * 0.3
        c.buf[c.i] = x + c.f * 0.86
        if (++c.i >= c.buf.length) c.i = 0
        s += y
      }
      for (const a of alls) {
        const b = a.buf[a.i]
        a.buf[a.i] = s + b * 0.5
        if (++a.i >= a.buf.length) a.i = 0
        s = b - s
      }
      out[j] = s
    }
    return out
  }
  const wet = [hall(verb[0], 0), hall(verb[1], 23)]

  // The pump (pad and bass dip under the kick), nothing under 25 Hz, then a
  // soft clip to a steady peak.
  const left = new Float32Array(N)
  const right = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const g = 1 - 0.55 * kickEnv[i]
    const fade = Math.min(1, i / (SR * 0.05))
    left[i] = (dry[0][i] + duck[0][i] * g + wet[0][i] * 2.6) * fade
    right[i] = (dry[1][i] + duck[1][i] * g + wet[1][i] * 2.6) * fade
  }
  const out = [svf(left, 25, 0.707, "hp"), svf(right, 25, 0.707, "hp")]
  let peak = 1e-9
  for (const c of out) for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(c[i]))
  const pre = 1.6 / peak
  for (const c of out) for (let i = 0; i < N; i++) c[i] = Math.tanh(c[i] * pre) * 0.89
  return { sampleRate: SR, left: out[0], right: out[1] }
}

/** A 16-bit stereo WAV of the audio, with triangular dither from `seed`. */
export function wavBytes(audio: ScoreAudio, seed = 1): Uint8Array {
  const n = audio.left.length
  const bytes = new Uint8Array(44 + n * 4)
  const view = new DataView(bytes.buffer)
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[at + i] = s.charCodeAt(i)
  }
  text(0, "RIFF")
  view.setUint32(4, 36 + n * 4, true)
  text(8, "WAVEfmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 2, true)
  view.setUint32(24, audio.sampleRate, true)
  view.setUint32(28, audio.sampleRate * 4, true)
  view.setUint16(32, 4, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, n * 4, true)
  const rnd = mulberry32(seed >>> 0 || 1)
  for (let i = 0; i < n; i++)
    for (const [c, ch] of [
      [0, audio.left],
      [1, audio.right],
    ] as const) {
      const v = Math.round((ch[i] + (rnd() - rnd()) / 32768) * 32767)
      view.setInt16(44 + (i * 2 + c) * 2, Math.max(-32768, Math.min(32767, v)), true)
    }
  return bytes
}
