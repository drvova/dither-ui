// The page an unknown address lands on. It answers 404 and is never
// indexed (the page says so itself); a static host serves it as `404.html`.
import { Meta } from "@solidjs/meta"
import { HttpStatusCode } from "@solidjs/start"
import PageHead from "@/pages/docs/PageHead"
import { MissingPage } from "@/pages/landing"

export default function Missing() {
  return (
    <>
      <PageHead page="missing" />
      {/* the landing's ground, obsidian, in either theme */}
      <Meta name="theme-color" content="#101214" />
      <HttpStatusCode code={404} />
      <MissingPage />
    </>
  )
}
