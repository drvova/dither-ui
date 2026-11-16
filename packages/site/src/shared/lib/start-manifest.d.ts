// SolidStart's manifest of the client's build, as its server reads it (the
// module its own lazy components take their stylesheets from): what an
// island's chunk links (`island.tsx`).
declare module "solid-start:get-manifest" {
  export function getManifest(target: "client" | "ssr"): {
    getAssets(id: string): Promise<{ tag: string; attrs: Record<string, string> }[]>
  }
}
