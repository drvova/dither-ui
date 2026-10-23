// The numbers the landing states about the kit. Claims are facts:
// tests/landing-facts.spec.ts recounts each from the kit and the docs IA,
// so a kit change that moves one fails until the page says it.
export const FACTS = [
  { label: "components", value: 264 },
  { label: "chart types", value: 6 },
  { label: "surfaces", value: 46 },
  { label: "matrix", value: 4, text: "4×4" },
] as const
