import { MetaProvider, Title } from "@solidjs/meta"
import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start/router"
import { Suspense } from "solid-js"
import { IconSprite } from "@dither-ui/kit"
import { spriteUrl } from "@/shared/ui/sprite"
import "./app.css"

export default function App() {
  return (
    <Router
      base={import.meta.env.SERVER_BASE_URL.replace(/\/$/, "")}
      root={(props) => (
        <MetaProvider>
          <Title>dither-ui</Title>
          {/* every kit glyph on the site's own pages from the site's sprite */}
          <IconSprite.Provider value={spriteUrl()}>
            <Suspense>{props.children}</Suspense>
          </IconSprite.Provider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
