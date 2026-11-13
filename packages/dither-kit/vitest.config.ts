// The kit's component specs (`tests/solid/`), in jsdom with Solid's browser
// build. The framework-free specs beside them (`tests/*.spec.ts`) run with
// `rs test` at the workspace root.
import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [solid()],
  resolve: { conditions: ["development", "browser"] },
  test: { environment: "jsdom", include: ["tests/solid/**/*.spec.{ts,tsx}"] },
})
