// The hero film's beats in seconds — the one timeline both the film's
// builder (films/hero.ts) and the agent transcript beside it read, so the
// transcript's lines land on the frames they describe.
export const BEATS = {
  tilt: 0.4,
  exploded: 1.6,
  reseed: 2.2,
  flipOn: 3.2,
  press: 3.9,
  unseed: 5.0,
  flipOff: 5.9,
  fold: 6.7,
  flat: 8.0,
  end: 9.6,
} as const

/** The seed the board shows at `t`: the re-seed lands with the morph. */
export const SEEDS = { rest: 512, reseeded: 513, morph: 0.8 } as const
