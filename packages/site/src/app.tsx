import { MetaProvider } from "@solidjs/meta"
import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start/router"
import { Suspense } from "solid-js"
import SpriteRoot from "@/shared/ui/SpriteRoot"
import "./app.css"

// Every link is the browser's: each page is a prerendered file of its own,
// and a static page (`shared/lib/island`) has no components in the browser
// to render a route with, so the router takes no link (`explicitLinks`).
// Each route renders its page's head (`PageHead`).
export default function App() {
  return (
    <Router
      base={import.meta.env.SERVER_BASE_URL.replace(/\/$/, "")}
      explicitLinks
      root={(props) => (
        <MetaProvider>
          <SpriteRoot>
            <Suspense>{props.children}</Suspense>
          </SpriteRoot>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
