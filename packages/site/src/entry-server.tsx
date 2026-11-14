// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server"
import { For, Show } from "solid-js"
import { getRequestEvent } from "solid-js/web"
import { ICON_HEAD } from "@/app/install-files"
import { PAGE_END_ID, PAGE_REVEAL_SCRIPT, speculationRules } from "@/app/page-reveal"
import michroma from "@/shared/fonts/michroma-latin.woff2?url"
import { appPathname, assetPath } from "@/shared/lib/routes"
import { RISE_HEAD_SCRIPT } from "@/shared/lib/rise-wait"
import { THEME_HEAD_SCRIPT } from "@/shared/lib/useTheme"
import { DISPLAY_FACE, pageOf, TURNS_WITH_THEME } from "@/pages/docs/heads"

// The shell every page is rendered into. The landing is printed in the
// dark, always; on a page that turns with the reader's theme the head sets
// the stored one before the first paint, and the page keeps it.
// Each route sets its own head (`pages/docs/PageHead`); the shell carries
// what every page of the site shares (never the
// player's): the root's `data-page` marker in the bytes (the grounds key on
// it, so the first frame is the page's own), the page transition's hand-off
// before the first frame and the marker at the end of the body it waits
// for, the rise's waiting state, the speculation rules, the site's icons
// and the display face fetched with the HTML.
export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => {
      const page = pageOf(appPathname(new URL(getRequestEvent()!.request.url).pathname))
      return (
        <html lang="en" class="dark" data-page={page ?? undefined}>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <Show when={page}>
              <Show when={page && TURNS_WITH_THEME[page]}>
                <script innerHTML={THEME_HEAD_SCRIPT} />
              </Show>
              <script innerHTML={PAGE_REVEAL_SCRIPT} />
              <script innerHTML={RISE_HEAD_SCRIPT} />
              <script type="speculationrules" innerHTML={speculationRules(import.meta.env.BASE_URL)} />
              <For each={ICON_HEAD}>{(t) => <link {...t.attrs} href={assetPath(t.attrs.href)} />}</For>
              <Show when={page && DISPLAY_FACE[page]}>
                <link href={michroma} rel="preload" as="font" crossorigin="" />
              </Show>
            </Show>
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
            <Show when={page}>
              <span id={PAGE_END_ID} hidden />
            </Show>
          </body>
        </html>
      )
    }}
  />
))
