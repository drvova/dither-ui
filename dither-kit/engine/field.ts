import { inject, type InjectionKey, type Ref } from "vue"

export type FieldContext = {
  controlId: Ref<string>
  describedBy: Ref<string | undefined>
  invalid: Ref<boolean>
}

export const FIELD_CONTEXT: InjectionKey<FieldContext> = Symbol("dither-field")
export const useField = () => inject(FIELD_CONTEXT, null)
