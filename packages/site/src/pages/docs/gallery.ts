// The docs' picker galleries: a picked tile or chip wears the site's
// pressed state (ink in a ring), so the pick reads on either theme, never a
// fill a shade off the ground.
export const thumbClass = (active: boolean) =>
  `rounded-md p-2 text-left transition-colors ${active ? "ring-on" : "hover:bg-card/50"}`
export const thumbLabel = (active: boolean) =>
  `mt-2 text-center text-[10px] transition-colors ${active ? "text-foreground" : "text-muted-foreground"}`
