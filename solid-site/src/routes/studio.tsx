// The Studio, and what the Vue app's shell did for it: its title, the
// root's `data-page` marker, the install surface's head (the icons, the
// app's manifest and iOS's app tags, from the one table the Vue build
// injects from), the browser chrome's colour in the theme the reader
// picked, and the service worker's registration.
//
// Not here yet: the files that head points at (the manifest, the icons)
// and the worker itself (`sw.js`) are made only by the Vue build, so the
// registration finds nothing on this site until the build pipeline moves.
import { Link, Meta, Title } from "@solidjs/meta"
import { createSignal, For, onCleanup, onMount } from "solid-js"
import { installHead, STUDIO_GROUND } from "@/app/install-files"
import { registerOffline } from "@/app/offline"
import { ROUTE_TITLES } from "@/shared/config/titles"
import { StudioPage } from "~/pages/studio"
import { appPathname, assetPath } from "~/shared/lib"

/** The Studio's entry in the install table. */
const HEAD = installHead("studio/index")

export default function Studio() {
  // The browser's own chrome wears the page's ground in the theme the
  // reader picked: the Studio's dark ground until the page has painted,
  // then the ground as computed, read again whenever the theme turns (the
  // root's class is the theme).
  const [ground, setGround] = createSignal<string>(STUDIO_GROUND)
  onMount(() => {
    const root = document.documentElement
    // The route marks the root, which the pages' grounds key on.
    root.dataset.page = "studio"
    const tint = () => setGround(getComputedStyle(document.body).backgroundColor || STUDIO_GROUND)
    const turned = new MutationObserver(tint)
    turned.observe(root, { attributes: true, attributeFilter: ["class"] })
    // After the first frame has painted, styles are clean and the read free.
    const frame = requestAnimationFrame(() => setTimeout(tint))
    // The Studio is an app too: installed or not, it opens offline.
    registerOffline(assetPath("/"), appPathname())
    onCleanup(() => {
      turned.disconnect()
      cancelAnimationFrame(frame)
      if (root.dataset.page === "studio") delete root.dataset.page
    })
  })
  return (
    <>
      <Title>{ROUTE_TITLES.studio}</Title>
      <Meta name="theme-color" content={ground()} />
      <For each={HEAD}>
        {(t) =>
          t.tag === "link" ? (
            <Link {...t.attrs} href={assetPath(t.attrs.href)} />
          ) : (
            <Meta name={t.attrs.name} content={t.attrs.content} />
          )
        }
      </For>
      <StudioPage />
    </>
  )
}
