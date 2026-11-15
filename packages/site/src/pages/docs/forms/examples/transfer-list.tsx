import { createSignal } from "solid-js"
import { DitherTransferList } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const ALL_ROLES = ["admin", "editor", "viewer", "billing", "support"]
  const [roles, setRoles] = createSignal(["admin"])

  return (
    <DitherTransferList
      value={roles()}
      onUpdateModelValue={(next) => setRoles(next)}
      source={ALL_ROLES}
      sourceLabel="Roles"
      targetLabel="Assigned"
    />
  )
}

export const meta = defineExample({
  component: DitherTransferList,
  title: "Transfer list",
  studio: {
    group: "inputs",
    frame: { w: 420, h: 190 },
    controls: { sourceLabel: { demo: "Available" }, targetLabel: { demo: "Selected" }, disabled: {} },
    model: { prop: "value" },
  },
})
