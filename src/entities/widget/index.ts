export * from "./model/types"
export { createComponent, createWidget, type SimpleWidgetKind } from "./model/factory"
export { widgetCode } from "./model/codegen"
export {
  COMPONENT_REGISTRY,
  componentEntry,
  type ComponentEntry,
  defaultComponentProps,
  type PropSpec,
} from "./model/registry"
