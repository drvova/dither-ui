// What a `DitherField` tells the control inside it: the id its label points
// at, its label's own id (for a control that names itself by it and by its
// own text), the id of its help text, and whether it holds an error.

import { type Accessor, createContext, useContext } from "solid-js"

export type FieldContext = {
  controlId: Accessor<string>
  labelId?: Accessor<string | undefined>
  describedBy: Accessor<string | undefined>
  invalid: Accessor<boolean>
}

export const FieldContextKey = createContext<FieldContext>()
export const useField = (): FieldContext | null => useContext(FieldContextKey) ?? null
