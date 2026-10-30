// The kit as the landing states it. Claims are facts:
// tests/landing-facts.spec.ts recounts each one from the kit, so a kit
// change that moves one fails until the page says it.
export const COMPONENT_COUNT = 266

/** The packages the kit needs beside Vue (its peer dependencies), in the
 * order the install step names them. */
export const RUNTIME_DEPS = ["d3-scale", "d3-shape", "clsx", "tailwind-merge"] as const
