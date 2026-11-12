// The page an unknown address lands on. It answers 404 and is never
// indexed (the page says so itself); a static host serves it as `404.html`.
import { Title } from "@solidjs/meta"
import { HttpStatusCode } from "@solidjs/start"
import { ROUTE_TITLES } from "@/shared/config/titles"
import { MissingPage } from "~/pages/landing"

export default function Missing() {
  return (
    <>
      <Title>{ROUTE_TITLES.missing}</Title>
      <HttpStatusCode code={404} />
      <MissingPage />
    </>
  )
}
