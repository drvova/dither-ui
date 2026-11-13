// The Studio, and what only its page carries: its head, the app's
// manifest and iOS's app tags (the install surface's own table; the icons
// are the shell's), the browser chrome's colour in the theme the reader
// picked, and the service worker's registration.
import { Link, Meta } from "@solidjs/meta"
import { createSignal, For, onCleanup, onMount } from "solid-js"
import { APP_HEAD, STUDIO_GROUND } from "@/app/install-files"
import { registerOffline } from "@/app/offline"
import PageHead from "@/pages/docs/PageHead"
import { StudioPage } from "@/pages/studio"
import { appPathname, assetPath } from "@/shared/lib"

export default function Studio() {
  // The browser's own chrome wears the page's ground in the theme the
  // reader picked: the Studio's dark ground until the page has painted,
  // then the ground as computed, read again whenever the theme turns (the
  // root's class is the theme).
  const [ground, setGround] = createSignal<string>(STUDIO_GROUND)
  onMount(() => {
    const root = document.documentElement
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
    })
  })
  return (
    <>
      <PageHead page="studio" />
      <Meta name="theme-color" content={ground()} />
      <For each={APP_HEAD}>
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
