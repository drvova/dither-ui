// genome: one integer describes the whole page. Every organism derives its
// seed from the site seed and its own name, so a build is reproducible
// from a single number and no creature picks a seed of its own. The seed
// is fixed per build on purpose — a fresh creature on every visit would be
// novelty at the cost of surprise.

export const SITE_SEED = 20251008

/** A stable 31-bit seed for an organ of the page (same name, same seed). */
export function seedFor(organ: string, site = SITE_SEED): number {
  let h = Math.imul(site ^ 0x9e3779b9, 0x85ebca6b) >>> 0
  for (let i = 0; i < organ.length; i++) {
    h = Math.imul(h ^ organ.charCodeAt(i), 0xc2b2ae35) >>> 0
    h ^= h >>> 15
  }
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2d) >>> 0
  return (h ^ (h >>> 16)) & 0x7fffffff
}
