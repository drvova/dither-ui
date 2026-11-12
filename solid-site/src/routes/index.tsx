// The landing.
import { Meta, Title } from "@solidjs/meta"
import { ROUTE_TITLES } from "@/shared/config/titles"
import { LandingPage } from "~/pages/landing"

export default function Landing() {
  return (
    <>
      <Title>{ROUTE_TITLES.landing}</Title>
      {/* the landing's ground, obsidian, in either theme */}
      <Meta name="theme-color" content="#101214" />
      <LandingPage />
    </>
  )
}
