import { createContext, useContext } from "solid-js"
import type { Bench } from "./bench"

export const BENCH = createContext<Bench>()

/** The workbench of the preview this component draws for. */
export function useBench(): Bench {
  const bench = useContext(BENCH)
  if (!bench) throw new Error("useBench() outside a Workbench")
  return bench
}
