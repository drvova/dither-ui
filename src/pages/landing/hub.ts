// The component hub's shelves: a featured
// shelf, then one per docs family with its true size and its first
// sections. Static on purpose — the landing does not load the docs IA —
// and held honest by tests/hub.spec.ts, which checks every id resolves to
// a docs section of that family and every count against the family's size.

export type HubCard = { id: string; label: string; family: string; note?: string }
export type HubShelf = { value: string; label: string; count: number; note: string; cards: HubCard[] }

/** Every docs family in sidebar order with its section count — the catalog
 * plate draws one cell per section. */
export const FAMILIES = [
  { title: "Overview", count: 1 },
  { title: "Primitives", count: 19 },
  { title: "Typography", count: 25 },
  { title: "Handbook", count: 5 },
  { title: "Examples", count: 32 },
  { title: "Components", count: 100 },
  { title: "Backgrounds", count: 46 },
  { title: "Text", count: 24 },
  { title: "Animations", count: 49 },
  { title: "Utils", count: 1 },
] as const

export const SECTION_COUNT = FAMILIES.reduce((n, f) => n + f.count, 0)

const count = (title: string) => FAMILIES.find((f) => f.title === title)?.count ?? 0
const cards = (family: string, list: [string, string][]): HubCard[] =>
  list.map(([id, label]) => ({ id, label, family }))

export const SHELVES: HubShelf[] = [
  {
    value: "explore",
    label: "Explore",
    count: 9,
    note: "",
    cards: [
      {
        id: "area",
        label: "Area chart",
        family: "Components",
        note: "A seeded dithered fill under a smooth line; hover reads every point.",
      },
      {
        id: "button",
        label: "Button",
        family: "Components",
        note: "Gradient, dotted, hatched and solid — four textures, one engine.",
      },
      {
        id: "avatar",
        label: "Avatar",
        family: "Components",
        note: "An identicon from a name: mirrored, seeded, dithered.",
      },
      {
        id: "aurora",
        label: "Aurora",
        family: "Backgrounds",
        note: "A backdrop that paints itself, at 8 fps or at 60.",
      },
      {
        id: "world",
        label: "World (3D)",
        family: "Components",
        note: "glTF, OBJ, STL or VRML through the same Bayer cells.",
      },
      {
        id: "shader",
        label: "Shader (GLSL)",
        family: "Components",
        note: "Shadertoy-style GLSL at cell resolution, then dithered.",
      },
      {
        id: "decrypted-text",
        label: "Decrypted text",
        family: "Text",
        note: "Text that resolves, character by character.",
      },
      { id: "switch", label: "Switch", family: "Components", note: "A toggle with a dithered track and a real label." },
      {
        id: "dashboard",
        label: "Dashboard",
        family: "Examples",
        note: "A whole screen composed from the kit — copy it.",
      },
    ],
  },
  {
    value: "components",
    label: "Components",
    count: count("Components"),
    note: "A live example, its props API and copy-ready code.",
    cards: cards("Components", [
      ["area", "Area chart"],
      ["line", "Line chart"],
      ["bar", "Bar chart"],
      ["pie", "Pie chart"],
      ["radar", "Radar chart"],
      ["sparkline", "Sparkline"],
      ["button", "Button"],
      ["avatar", "Avatar"],
      ["gradient", "Gradient"],
    ]),
  },
  {
    value: "backgrounds",
    label: "Backgrounds",
    count: count("Backgrounds"),
    note: "A full-bleed canvas surface on your palette.",
    cards: cards("Backgrounds", [
      ["aurora", "Aurora"],
      ["waves", "Waves"],
      ["line-waves", "Line waves"],
      ["threads", "Threads"],
      ["silk", "Silk"],
      ["plasma", "Plasma"],
      ["iridescence", "Iridescence"],
      ["dot-grid", "Dot grid"],
      ["ripple-grid", "Ripple grid"],
    ]),
  },
  {
    value: "text",
    label: "Text",
    count: count("Text"),
    note: "A DOM text effect that honours reduced motion.",
    cards: cards("Text", [
      ["gradient-text", "Gradient text"],
      ["shiny-text", "Shiny text"],
      ["glitch-text", "Glitch text"],
      ["split-text", "Split text"],
      ["rotating-text", "Rotating text"],
      ["count-up", "Count up"],
      ["number-flow", "Number flow"],
      ["text-type", "Text type"],
      ["blur-text", "Blur text"],
    ]),
  },
  {
    value: "animations",
    label: "Animations",
    count: count("Animations"),
    note: "An interaction or motion effect for any element.",
    cards: cards("Animations", [
      ["animated-content", "Animated content"],
      ["fade-content", "Fade content"],
      ["gradual-blur", "Gradual blur"],
      ["star-border", "Star border"],
      ["electric-border", "Electric border"],
      ["glare-hover", "Glare hover"],
      ["magnet", "Magnet"],
      ["click-spark", "Click spark"],
      ["blob-cursor", "Blob cursor"],
    ]),
  },
  {
    value: "examples",
    label: "Examples",
    count: count("Examples"),
    note: "A whole screen composed from the kit.",
    cards: cards("Examples", [
      ["dashboard", "Dashboard"],
      ["shell", "App shell"],
      ["monitoring", "Monitoring"],
      ["team", "Team"],
      ["usage", "Usage & billing"],
      ["signin", "Sign in"],
      ["signup", "Sign up"],
      ["magic-link", "Magic link"],
      ["twofactor", "Two-factor"],
    ]),
  },
]
