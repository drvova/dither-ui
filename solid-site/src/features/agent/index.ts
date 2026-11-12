// The Vue site's `src/features/agent/index.ts`, line for line, its imports of ported
// modules pointed at their Solid twins (it reaches the editor store through
// them, so it cannot be shared). Held to its source by `tests/site/state.spec.tsx`.
import { editor, placeGeneration, selectedArtboard } from "../../entities/editor"
import { evolveArtboard, type EvolveOptions } from "@/features/agent/evolve"

export { evolveArtboard, mutateProps, type EvolveOptions } from "@/features/agent/evolve"
export { addLaunchFilm } from "./film"
export {
  COMMAND_EVENT,
  chartFromData,
  type CommandResult,
  installStudioAgentApi,
  MIRROR_ID,
  PROTOCOL_VERSION,
  registrySchema,
  RESULT_EVENT,
  runCommand,
  type StudioAgentApi,
  type StudioCommand,
  summarize,
} from "./protocol"

/** The toolbar's evolve: a generation of the primary selection, placed as a
 * row beside it and selected. */
export function evolveSelected(opts: EvolveOptions = {}) {
  const parent = selectedArtboard.value
  if (!parent) return []
  const gen = placeGeneration(evolveArtboard(parent, { seed: Date.now() % 1_000_000, ...opts }))
  editor.replayToken++
  return gen
}
