import { rgb, type Seed } from "./palette"

export type DotVariant = "border" | "colored-border" | "filled"

export function dotPaint(variant: DotVariant, seed: Seed) {
  switch (variant) {
    case "colored-border":
      return { fill: "var(--card, #0b0b0c)", stroke: rgb(seed.line), strokeWidth: 1.5 }
    case "filled":
      return { fill: rgb(seed.star), stroke: rgb(seed.line), strokeWidth: 1 }
    default:
      return { fill: "var(--card, #0b0b0c)", stroke: rgb(seed.star, 0.8), strokeWidth: 1 }
  }
}
