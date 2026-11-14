import { DitherBreadcrumb } from "@dither-kit"

export default function Example() {
  return (
    <DitherBreadcrumb
      items={[{ label: "Home", href: "#/" }, { label: "Components", href: "#/docs" }, { label: "Breadcrumb" }]}
    />
  )
}
