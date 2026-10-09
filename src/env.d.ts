/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module "virtual:dither-utilities" {
  const map: import("./shared/lib/restyle").UtilityMap
  export default map
}
