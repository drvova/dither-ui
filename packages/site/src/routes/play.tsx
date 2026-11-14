// The player's page: one Studio frame on its own, the page a HyperFrames
// video export carries and the Studio's live preview opens
// (`/play/#doc=<base64url document>`). The route gives the stage; the
// player mounts in it once the page is in a browser (`pages/play/main.ts`,
// the same mount the single-file bundle calls, `../../standalone.ts`).
import { Link, Meta, Title } from "@solidjs/meta"
import { For, onCleanup, onMount } from "solid-js"
import { ICON_HEAD } from "@/app/install-files"
import { mountPlayer } from "@/pages/play/main"
import { assetPath } from "@/shared/lib"

export default function Play() {
  onMount(() => onCleanup(mountPlayer()))
  return (
    <>
      <Title>Player | dither-ui</Title>
      <Meta
        name="description"
        content="Plays one dither-ui Studio frame on its own: the page a HyperFrames video export carries."
      />
      <Meta name="robots" content="noindex, nofollow" />
      {/* The site's icons, which the shell gives only the pages it knows. */}
      <For each={ICON_HEAD}>{(t) => <Link {...t.attrs} href={assetPath(t.attrs.href)} />}</For>
      {/* The page's name and its one landmark, for a reader the frame says nothing to. */}
      <h1 class="sr-only">Studio frame player</h1>
      <main id="dither-stage" class="grid min-h-screen place-items-center" />
    </>
  )
}
