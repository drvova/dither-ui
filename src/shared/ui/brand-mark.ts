/** The brand mark as the cells of a 7x7 grid: the diamond within three
 * steps of its centre, the centre its ember core. The landing's lockup
 * keeps its own copy (`pages/landing/brand.ts`);
 * `tests/site-header.spec.ts` holds the two equal. */
export const MARK_CELLS = Array.from({ length: 49 }, (_, i) => ({ x: i % 7, y: Math.floor(i / 7) }))
  .filter((c) => Math.abs(c.x - 3) + Math.abs(c.y - 3) <= 3)
  .map((c) => ({ ...c, core: c.x === 3 && c.y === 3 }))
