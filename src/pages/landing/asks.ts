// The asks the agents section shows: what a harness sends the Studio, the
// frame it lands as and the Studio tool call that draws it. A screen is made
// only of registry components (`entities/widget/model/registry.ts`), the
// ones `add_screen` lays out, so each caption is true.
export const ASKS = [
  {
    id: "deploys",
    label: "Deploy panel",
    ask: "a deploy panel: this week's deploys, the build minutes used and an auto deploy switch",
    frame: "Deploys",
    drew: "One add_screen call: DitherHeading, DitherNumberText, DitherProgress and DitherSwitch.",
  },
  {
    id: "signup",
    label: "Sign-up card",
    ask: "a sign-up card for the beta with an email field and a changelog opt-in",
    frame: "Beta sign-up",
    drew: "One add_screen call: DitherHeading, DitherText, DitherEmailInput and DitherCheckbox.",
  },
  {
    id: "visits",
    label: "Visits chart",
    ask: "this week's visits as a bar chart, one bar a day",
    frame: "Visits",
    drew: "One add_chart call: a bar chart, seven labels and one series.",
  },
] as const
