import { DitherBreadcrumb } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherBreadcrumb
      items={[{ label: "Home", href: "#/" }, { label: "Components", href: "#/docs" }, { label: "Breadcrumb" }]}
    />
  )
}

export const meta = defineExample({
  component: DitherBreadcrumb,
  title: "Breadcrumb",
  studio: {
    group: "navigation",
    frame: { w: 320, h: 70 },
    controls: { items: { kind: "list", demo: ["Home", "Components", "Button"] }, separator: {} },
  },
})
