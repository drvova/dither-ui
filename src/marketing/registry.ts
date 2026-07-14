import { controls } from "./controls"

/** Which knobs the controls panel shows for each component. */
export type Knob =
  | "variant"
  | "bloom"
  | "stackType"
  | "color"
  | "animate"
  | "interactive"
  | "direction"
  | "twoTone"
  | "innerRadius"
  | "avatarName"

export type ComponentDef = {
  id: string
  label: string
  registry: string
  group: "Charts" | "Primitives"
  knobs: Knob[]
}

export const COMPONENTS: ComponentDef[] = [
  { id: "area", label: "Area", registry: "area-chart", group: "Charts", knobs: ["variant", "bloom", "stackType", "color", "animate", "interactive"] },
  { id: "line", label: "Line", registry: "area-chart", group: "Charts", knobs: ["bloom", "color", "animate", "interactive"] },
  { id: "bar", label: "Bar", registry: "bar-chart", group: "Charts", knobs: ["variant", "bloom", "stackType", "color", "animate", "interactive"] },
  { id: "pie", label: "Pie", registry: "pie-chart", group: "Charts", knobs: ["variant", "bloom", "innerRadius", "animate"] },
  { id: "radar", label: "Radar", registry: "radar-chart", group: "Charts", knobs: ["variant", "bloom", "animate"] },
  { id: "sparkline", label: "Sparkline", registry: "area-chart", group: "Charts", knobs: ["variant", "color", "bloom", "animate"] },
  { id: "button", label: "Button", registry: "button", group: "Primitives", knobs: ["variant", "color", "bloom"] },
  { id: "avatar", label: "Avatar", registry: "avatar", group: "Primitives", knobs: ["avatarName", "bloom", "animate"] },
  { id: "gradient", label: "Gradient", registry: "gradient", group: "Primitives", knobs: ["direction", "color", "twoTone", "bloom"] },
]

export function defOf(id: string): ComponentDef {
  return COMPONENTS.find((c) => c.id === id) ?? COMPONENTS[0]
}

// --- code snippet generator: reflects the live controls -----------------------

const bloomAttr = () => (controls.bloom !== "off" ? ` bloom="${controls.bloom}"` : "")
const animateAttr = () => (controls.animate ? "" : " :animate=\"false\"")
const interactiveAttr = () => (controls.interactive ? "" : " :interactive=\"false\"")
const stackAttr = () =>
  controls.stackType !== "default" ? ` stack-type="${controls.stackType}"` : ""
const variantAttr = () =>
  controls.variant !== "gradient" ? ` variant="${controls.variant}"` : ""

function chartCode(root: string, seriesKind: string): string {
  const label = root === "BarChart" ? "quarter" : "month"
  const dataName = root === "BarChart" ? "revenueData" : "trafficData"
  const keys = root === "BarChart" ? ["product", "services"] : ["desktop", "mobile"]
  const lines = keys
    .map((k) => `    <${seriesKind} dataKey="${k}"${variantAttr()} is-clickable />`)
    .join("\n")
  return `<${root}
  :data="${dataName}"
  :config="config"${stackAttr()}${bloomAttr()}${animateAttr()}${interactiveAttr()}
>
  <Grid />
  <XAxis dataKey="${label}" />
  <YAxis />
${lines}
  <Legend is-clickable />
  <Tooltip labelKey="${label}" />
</${root}>`
}

export function snippetFor(id: string): string {
  switch (id) {
    case "area":
      return chartCode("AreaChart", "Area")
    case "line":
      return chartCode("LineChart", "Line")
    case "bar":
      return chartCode("BarChart", "Bar")
    case "pie":
      return `<PieChart
  :data="marketData"
  :config="config"
  data-key="value"
  name-key="name"
  :inner-radius="${controls.innerRadius}"${bloomAttr()}${animateAttr()}
>
  <Pie${variantAttr()} />
  <Legend align="center" is-clickable />
  <Tooltip />
</PieChart>`
    case "radar":
      return `<RadarChart :data="skillData" :config="config" name-key="axis"${bloomAttr()}${animateAttr()}>
  <Radar dataKey="alpha"${variantAttr()} is-clickable />
  <Radar dataKey="beta"${variantAttr()} is-clickable />
  <Legend align="center" is-clickable />
  <Tooltip />
</RadarChart>`
    case "sparkline":
      return `<Sparkline
  :data="[4, 9, 6, 12, 8, 15, 11, 18, 14, 22, 19, 26]"
  color="${controls.color}"${variantAttr()}${animateAttr()}${bloomAttr()}
/>`
    case "button":
      return `<DitherButton color="${controls.color}" variant="${controls.variant}"${bloomAttr()}>
  Click me
</DitherButton>`
    case "avatar":
      return `<DitherAvatar name="${controls.avatarName}" :size="96"${bloomAttr()}${animateAttr()} />`
    case "gradient":
      return `<DitherGradient
  from="${controls.color}"${controls.twoTone ? ' to="pink"' : ""}
  direction="${controls.direction}"${bloomAttr()}
/>`
    default:
      return ""
  }
}
