// The kit's heavy engines the landing shows below its first screen, each
// its own chunk: the world engine and its model parsers (the bento's model,
// the build) and the shader's WebGL engine (the bento's shader, the
// footer's road); the charts are `shared/ui/charts.tsx`. The page's first
// load stays the hero's; these arrive with the page and take over the bytes
// it painted. A server renders the page whole, so the ones it renders are
// loaded before it is (as the docs' packs are): none suspends and streams
// in after the shell.
import { createMemo, splitProps } from "solid-js"
import type { DitherWorldProps } from "@dither-ui/kit"
import { lazyPart } from "@/shared/lib/lazy-part"

export const DitherWorld = lazyPart(() => import("@dither-ui/kit/solid/DitherWorld.tsx"))
/** Never rendered on a server: its card and the road mount it in a browser. */
export const DitherShader = lazyPart(() => import("@dither-ui/kit/solid/DitherShader.tsx"))

/** The kit's seeded probe (`sampleWorld`) as a world: the sample's writer
 * is the world engine's, so it comes with that chunk. */
export const SampleWorld = lazyPart(async () => {
  const [{ default: World }, { sampleWorld }] = await Promise.all([
    import("@dither-ui/kit/solid/DitherWorld.tsx"),
    import("@dither-ui/kit/engine/world.ts"),
  ])
  return {
    default: (props: Omit<DitherWorldProps, "source"> & { model: number }) => {
      const [own, rest] = splitProps(props, ["model"])
      const source = createMemo(() => sampleWorld(own.model))
      return <World {...rest} source={source()} />
    },
  }
})

if (import.meta.env.SSR) await Promise.all([DitherWorld.preload(), SampleWorld.preload()])
