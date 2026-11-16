// Every kit glyph on the site's own pages from the site's sprite
// (`sprite.ts`): around the app, and around each island of a static page,
// which hydrates as a root of its own (`shared/lib/island`).
import type { JSX } from "solid-js"
import { IconSprite } from "@dither-ui/kit"
import { spriteUrl } from "./sprite"

export default function SpriteRoot(props: { children?: JSX.Element }) {
  return <IconSprite.Provider value={spriteUrl()}>{props.children}</IconSprite.Provider>
}
