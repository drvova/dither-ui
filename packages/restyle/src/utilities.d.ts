// The utility map the rewriter reads, a virtual module each build makes with
// `utility-map.ts` (the site's Vite plugin, the workspace's Rstest plugin).
declare module "virtual-dither-utilities" {
  const map: import("./index").UtilityMap
  export default map
}
