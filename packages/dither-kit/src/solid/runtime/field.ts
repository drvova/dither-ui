// What a `DitherField` tells the control inside it: the id its label points
// at, the id of its help text, and whether it holds an error.

import { type Accessor, createContext, useContext } from "solid-js"

export type FieldContext = {
  controlId: Accessor<string>
  describedBy: Accessor<string | undefined>
  invalid: Accessor<boolean>
}

export const FieldContextKey = createContext<FieldContext>()
export const useField = (): FieldContext | null => useContext(FieldContextKey) ?? null
