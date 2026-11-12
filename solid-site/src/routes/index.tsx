// The landing.
import { Title } from "@solidjs/meta"
import { ROUTE_TITLES } from "@/shared/config/titles"
import { LandingPage } from "~/pages/landing"

export default function Landing() {
  return (
    <>
      <Title>{ROUTE_TITLES.landing}</Title>
      <LandingPage />
    </>
  )
}
