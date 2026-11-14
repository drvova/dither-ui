// Generated from @dither-ui/kit/solid/DitherScreen.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import type { JSX } from "solid-js"
import type { ScreenKind } from "@dither-ui/kit/engine/pixel.ts"
import { ScreenContext } from "@dither-ui/kit/solid/runtime/screen.ts"

export type DitherScreenProps = {
  /** @docs 'bayer' | 'line' | 'diagonal' | 'dot' | 'cross'
   * @default 'diagonal' */
  screen?: ScreenKind
  /** @docs content (every surface inside prints through the screen) */
  children?: JSX.Element
}

/** Prints everything inside it through one screen: every pixel surface and
 * chart below it reads its threshold matrix from here, so a line, hatch,
 * dot or cross screen replaces the Bayer pattern without a prop on each. */
export default function DitherScreen(props: DitherScreenProps) {
  return <ScreenContext.Provider value={() => props.screen ?? "diagonal"}>{props.children}</ScreenContext.Provider>
}
