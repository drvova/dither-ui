// The landing.
import { Meta } from "@solidjs/meta"
import PageHead from "@/pages/docs/PageHead"
import { LandingPage } from "@/pages/landing"

export default function Landing() {
  return (
    <>
      <PageHead page="landing" />
      {/* the landing's ground, obsidian, in either theme */}
      <Meta name="theme-color" content="#101214" />
      <LandingPage />
    </>
  )
}
