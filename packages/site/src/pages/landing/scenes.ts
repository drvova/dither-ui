// The landing's scroll scenes (`shared/lib/scroll-scene.ts`): where in its
// passage each one runs. The stylesheets beside their components turn
// `--scene` into the motion; this table says when.
import type { SceneRange } from "@/shared/lib/scroll-scene"

export const SCENES = {
  /** The hero eases back as the page leaves it: from its top reaching the
   * viewport's top to its foot leaving it. */
  hero: { from: ["top", 0], to: ["bottom", 0] },
  /** A bento card slides up into place as it comes in: from its top at the
   * viewport's foot to six tenths of the way up (the glide lands most of
   * it in the first stretch). */
  tile: { from: ["top", 1], to: ["top", 0.4] },
  /** A plate holds while the reader scrolls, scaling up into place. */
  plate: { pin: true },
} as const satisfies Record<string, SceneRange>
