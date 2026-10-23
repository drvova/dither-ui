// The workbench's tools, after Kobra's tray (Mesurer): group 1 inspects,
// group 2 annotates; each tool has one key. Toggles (rulers, responsive,
// motion) sit beside the tools and do not replace the active one. Icons
// are 16-unit stroke paths drawn in currentColor.

export type ToolId =
  | "inspect"
  | "xray"
  | "guides"
  | "type"
  | "color"
  | "loupe"
  | "a11y"
  | "select"
  | "arrow"
  | "pen"
  | "eraser"
  | "text"
  | "comment"
  | "shot"
  | "video"

export type ToggleId = "rulers" | "responsive" | "motion"

export type Tool = { id: ToolId; key: string; label: string; group: 1 | 2; icon: string; hint: string }
export type ToggleDef = { id: ToggleId; key: string; label: string; icon: string }

export const TOOLS: Tool[] = [
  {
    id: "inspect",
    key: "i",
    label: "Inspect",
    group: 1,
    icon: "M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3M6 6l5 2-2 1-1 2z",
    hint: "point to measure · click to pin · arrows walk the tree · hold Alt for distances, Alt+S keeps one",
  },
  {
    id: "xray",
    key: "x",
    label: "X-ray",
    group: 1,
    icon: "M2.5 2.5h11v11h-11zM5 5h6v6H5zM7.25 7.25h1.5v1.5h-1.5z",
    hint: "every element's box, tinted by depth · point to name one",
  },
  {
    id: "guides",
    key: "g",
    label: "Guides",
    group: 1,
    icon: "M5 1.5v13M1.5 10h13M9.5 1.5v2M9.5 6v1",
    hint: "click to place a guide · H / V turns it · drag to move, off the stage to delete · drag out of the rulers too",
  },
  {
    id: "type",
    key: "a",
    label: "Typography",
    group: 1,
    icon: "M2.5 13l3.5-10 3.5 10M3.8 9.5h4.4M11 8.5h3M12.5 8.5v4.5",
    hint: "point at text for its lines, baselines and contrast · click to pin",
  },
  {
    id: "color",
    key: "p",
    label: "Sample color",
    group: 1,
    icon: "M10.5 2.5l3 3-7 7H3.5v-3zM9 4l3 3",
    hint: "click a pixel to sample it · the screen picker opens where the browser has one",
  },
  {
    id: "loupe",
    key: "z",
    label: "Pixel loupe",
    group: 1,
    icon: "M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM10.5 10.5L14 14M5.5 7h3M7 5.5v3",
    hint: "the pixels under the pointer, magnified on their grid · scroll to zoom · click to sample",
  },
  {
    id: "a11y",
    key: "y",
    label: "Accessibility",
    group: 1,
    icon: "M8 2.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zM3 6.2l5 .8 5-.8M8 7v3.2M5.8 14L8 10.2l2.2 3.8",
    hint: "point for role, name and states · numbers show the Tab order · flags break the floor",
  },
  {
    id: "select",
    key: "s",
    label: "Select",
    group: 2,
    icon: "M3.5 2.5l9 5-4 1-2 4.5z",
    hint: "click or drag around annotations · drag to move · Delete removes · ⌘A selects all",
  },
  {
    id: "arrow",
    key: "d",
    label: "Arrow",
    group: 2,
    icon: "M3 13L13 3M7 3h6v6",
    hint: "drag to draw an arrow · its ends dock to elements",
  },
  {
    id: "pen",
    key: "n",
    label: "Pen",
    group: 2,
    icon: "M2.5 13.5l1-4 7-7 3 3-7 7zM9 4l3 3",
    hint: "draw freehand · ink swells with pressure or a slow hand · pick ink or marker below",
  },
  {
    id: "eraser",
    key: "e",
    label: "Eraser",
    group: 2,
    icon: "M6.5 13.5h7M2.5 10l6-6 4.5 4.5-5 5H6z",
    hint: "rub over ink to remove only what you pass",
  },
  {
    id: "text",
    key: "t",
    label: "Text",
    group: 2,
    icon: "M2.5 2.5h11v11h-11zM5.5 5.5h5M8 5.5v5",
    hint: "click to write a note · Enter keeps it, Shift+Enter breaks the line",
  },
  {
    id: "comment",
    key: "m",
    label: "Comment",
    group: 2,
    icon: "M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z",
    hint: "click an element to start a thread on it · K copies every thread for an agent",
  },
  {
    id: "shot",
    key: "c",
    label: "Screenshot",
    group: 2,
    icon: "M4.5 1.5v10h10M1.5 4.5h10v10",
    hint: "drag a region of the stage to capture it",
  },
  {
    id: "video",
    key: "v",
    label: "Record video",
    group: 2,
    icon: "M1.5 4.5h8.5v7H1.5zM10 7l4.5-2.5v7L10 9",
    hint: "drag a region of the stage, then share this tab to record it (up to 60 s)",
  },
]

export const TOGGLES: ToggleDef[] = [
  { id: "rulers", key: "r", label: "Rulers", icon: "M1.5 5.5h13v5h-13zM4 5.5v2M6.5 5.5v1.5M9 5.5v2M11.5 5.5v1.5" },
  { id: "responsive", key: "b", label: "Responsive", icon: "M1.5 3.5h9v7h-9zM4 13h4M11.5 6.5h3v7h-3z" },
  { id: "motion", key: "o", label: "Motion", icon: "M1.5 12.5c3.5 0 3.5-9 6.5-9s3 9 6.5 9" },
]

export const ICONS = {
  group1: "M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3M6 6l5 2-2 1-1 2z",
  group2: "M2 12c2-5 4-5 5-2s3 3 5-3M11.5 2.5l2 2",
  undo: "M5 4L2 7l3 3M2 7h7.5a3.5 3.5 0 0 1 0 7H7",
  redo: "M11 4l3 3-3 3M14 7H6.5a3.5 3.5 0 0 0 0 7H9",
  agent: "M5.5 2h5v2h-5zM4 3H2.5v11.5h11V3H12M5 8h6M5 11h4",
  settings:
    "M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13",
  close: "M3.5 3.5l9 9M12.5 3.5l-9 9",
  copy: "M5.5 5.5h8v8h-8zM2.5 10.5v-8h8",
  download: "M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11",
  trash: "M2.5 4.5h11M6 4.5V2.5h4v2M4 4.5l.8 9h6.4l.8-9",
  play: "M4.5 2.5l9 5.5-9 5.5z",
  pause: "M4.5 2.5v11M11.5 2.5v11",
  step: "M3.5 2.5l7 5.5-7 5.5zM12.5 2.5v11",
  back: "M12.5 2.5l-7 5.5 7 5.5zM3.5 2.5v11",
  stop: "M3.5 3.5h9v9h-9z",
}

export const toolById = (id: ToolId) => TOOLS.find((t) => t.id === id)!
