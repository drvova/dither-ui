// The page `css-motion.spec.ts` bundles and opens in a real browser: the
// kit's CSS-driven components mounted one by one, and the kit clock's two
// doors, so the spec can direct a moment and read what CSS shows at it.
import {
  DitherCountUp,
  DitherDecryptedText,
  DitherRotatingText,
  DitherSequence,
  DitherTextType,
  DitherTrueFocus,
  release,
  seek,
} from "@dither-ui/kit"
import type { JSX } from "solid-js"
import { render } from "solid-js/web"

const PIECES: Record<string, () => JSX.Element> = {
  focus: () => <DitherTrueFocus text="one two three" interval={1000} blur={4} />,
  rotate: () => <DitherRotatingText texts={["one", "two", "three"]} interval={1000} />,
  type: () => <DitherTextType texts={["Hello", "World"]} typingSpeed={100} deletingSpeed={100} pause={200} />,
  count: () => <DitherCountUp from={0} to={100} duration={1000} />,
  sequence: () => (
    <DitherSequence stagger={0.3} duration={0.5}>
      <div class="cell" />
      <div class="cell" />
      <div class="cell" />
    </DitherSequence>
  ),
  decrypt: () => <DitherDecryptedText text="KIT" speed={3} />,
}

declare global {
  interface Window {
    kit: { mount: (name: string) => void; unmount: () => void; seek: (ms: number) => void; release: () => void }
  }
}

const stage = document.getElementById("stage")!
let dispose: (() => void) | null = null
window.kit = {
  mount: (name) => {
    dispose?.()
    dispose = render(PIECES[name]!, stage)
  },
  unmount: () => {
    dispose?.()
    dispose = null
  },
  seek,
  release,
}
