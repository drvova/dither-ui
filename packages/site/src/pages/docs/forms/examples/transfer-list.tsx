import { createSignal } from "solid-js"
import { DitherTransferList } from "@dither-kit"

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
