// The landing: a static page, its islands woken in the browser
// (`shared/lib/island`); the page's own code never ships to it.
import { Meta } from "@solidjs/meta"
import PageHead from "@/pages/docs/PageHead"
import { LANDING } from "@/pages/landing/islands"
import LandingPage from "@/pages/landing/LandingPage"
import { Static } from "@/shared/lib/island"

function Page() {
  return (
    <>
      <PageHead page="landing" />
      {/* the landing's ground, obsidian, in either theme */}
      <Meta name="theme-color" content="#101214" />
      <LandingPage />
    </>
  )
}

/** The page, on a server only. */
const OnServer = import.meta.env.SSR ? Page : undefined

export default function Landing() {
  return <Static islands={LANDING} page={OnServer} />
}
