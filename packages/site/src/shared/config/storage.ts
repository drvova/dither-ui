// Every name the site keeps in localStorage, in one table: what a reader's
// browser holds for them is these strings, so a key here is never renamed
// (a renamed key forgets what every reader kept). A module reads and
// writes through `shared/lib/storage.ts` by one of these; the tasks that set
// a few before the app reads them keep a pinned copy (`@dither-ui/tasks`'s
// `SITE_STORAGE`, held to this by `tests/site/protocols.spec.ts`).

/** One key a name. */
export const STORAGE_KEYS = {
  /** The reader's theme, "dark" or "light" (`useTheme`, and the head's script before the first paint). */
  theme: "dither-theme",
  /** The interface sounds, "on" or "off" (`shared/lib/sound.ts`). */
  sounds: "dither-sounds",
  /** The reader's styling system (`shared/lib/restyle.ts`). */
  styling: "dither-styling",
  /** The Studio's project list (`features/persistence`). */
  projects: "dither-studio-projects",
  /** The project the Studio opens on. */
  activeProject: "dither-studio-active",
  /** The one document the Studio kept before projects, moved into the first. */
  legacyDocument: "dither-studio-v8",
  /** The Studio's side panel open or closed. */
  panelOpen: "dither-studio-panel-open",
  /** The side panel's tab, properties or layers. */
  panelTab: "dither-studio-panel-tab",
  /** The first visit's tour, once seen. */
  guideSeen: "dither-studio-guide-seen",
  /** The saved chart presets. */
  presets: "dither-presets-v1",
  /** The agent panel's harness choice (`AgentConfig`). */
  agentConfig: "dither-agent-config",
  /** The tools harnesses built, newest first. */
  agentBuilt: "dither-agent-built",
  /** The workbench's preferences, one set for every preview. */
  workbenchSettings: "dither-workbench-settings",
} as const

/** One key a project, a chat or a preview: the prefix and what it is kept for. */
export const STORAGE_PREFIXES = {
  /** + a project's id: its document. */
  document: "dither-studio-doc-",
  /** + a project's id: its chats' index. */
  chats: "dither-agent-chats-",
  /** + a project's id and `/` a chat's: its thread (a project's id alone: the thread kept before chats). */
  thread: "dither-agent-session-",
  /** + a project's id and `/` a chat's: its unsent draft (a project's id alone: the draft kept before chats). */
  draft: "dither-agent-draft-",
  /** + a preview's key: its workbench workspace. */
  workspace: "dither-workbench:",
} as const
