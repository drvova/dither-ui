// The Studio agent's surface: the command table and its doors, the chats,
// the hand-off, the one tool and the harness's settings. Its second entry is
// `acp.ts`, the ACP client, which only the agent panel loads (lazily): kept
// out of this index so the Studio's first load never carries it.
import { editor, placeGeneration, selectedArtboard } from "../../entities/editor"
import { evolveArtboard, type EvolveOptions } from "./evolve"

export { addLaunchFilm } from "./film"
export { commandRows, registrySchema, runCommand, type ToolStep } from "./commands"
export { COMMAND_EVENT, installStudioAgentApi, MIRROR_ID, RESULT_EVENT } from "./protocol"
export {
  agoOf,
  type ChatMeta,
  chatGroups,
  chats,
  chatsOf,
  forgetProject,
  loadThread,
  newChat,
  openChat,
  openProject,
  pinChat,
  removeChat,
  renameChat,
  saveThread,
  stepChat,
  titleOf,
} from "./chats"
export { type Built, built, parseDither, removeBuilt } from "./dither"
export { askAgent, handoff, takeAsk, togglePicked } from "./handoff"
export {
  type AgentActivity,
  type AgentCommand,
  type AgentConfig,
  type AgentEvent,
  type ContextUse,
  DEFAULT_BRIDGE_URL,
  loadAgentConfig,
  loadDraft,
  type Mode,
  type ModelChoice,
  STUDIO_SERVER,
  type Setting,
  saveAgentConfig,
  saveDraft,
  type Usage,
} from "./tools"

/** The toolbar's evolve: a generation of the primary selection, placed as a
 * row beside it and selected. */
export function evolveSelected(opts: EvolveOptions = {}) {
  const parent = selectedArtboard.value
  if (!parent) return []
  const gen = placeGeneration(evolveArtboard(parent, { seed: Date.now() % 1_000_000, ...opts }))
  editor.replayToken++
  return gen
}
