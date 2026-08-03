import { AUTH_NAV } from "./examples/auth-nav"
import { PRODUCT_NAV } from "./examples/product-nav"
import { SIDEBAR_NAV } from "./examples/sidebar-nav"
import { STATS_NAV } from "./examples/stats-nav"
import { TABLE_NAV } from "./examples/table-nav"
import { CHAT_NAV } from "./examples/chat-nav"
import { NOTIFICATIONS_NAV } from "./examples/notifications-nav"
import { FORM_NAV } from "./components/form-nav"
import { FIELD_NAV } from "./components/field-nav"
import { SELECTION_NAV } from "./components/selection-nav"
import { FEEDBACK_NAV } from "./components/feedback-nav"
import { STRUCTURE_NAV } from "./components/structure-nav"
import { LAYOUT_NAV } from "./components/layout-nav"
import { MEDIA_NAV } from "./components/media-nav"
import { OVERLAY_NAV } from "./components/overlay-nav"
import { SURFACE_NAV } from "./components/surface-nav"
import { NAVIGATION_NAV } from "./components/navigation-nav"
import { BACKGROUNDS_NAV } from "./backgrounds/backgrounds-nav"
import { TEXT_NAV } from "./text/text-nav"
import { ANIMATIONS_NAV } from "./animations/animations-nav"

// Docs sidebar IA — the single source of truth for section ids, labels, and
// grouping. Section ids are permanent deep links (`/docs/<id>`): relabel
// freely, never rename an id.
export interface DocsGroup {
  title: string
  items: { id: string; label: string }[]
}

export const GROUPS: DocsGroup[] = [
  {
    title: "Overview",
    items: [{ id: "getting-started", label: "Quick start" }],
  },
  {
    title: "Handbook",
    items: [
      { id: "styling", label: "Styling" },
      { id: "composition", label: "Composition" },
      { id: "seeds", label: "Seeds" },
      { id: "motion", label: "Animation" },
      { id: "accessibility", label: "Accessibility" },
    ],
  },
  {
    title: "Examples",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "shell", label: "App shell" },
      { id: "monitoring", label: "Monitoring" },
      { id: "team", label: "Team" },
      { id: "usage", label: "Usage & billing" },
      { id: "signin", label: "Sign in" },
      ...AUTH_NAV,
      ...PRODUCT_NAV,
      ...SIDEBAR_NAV,
      ...STATS_NAV,
      ...TABLE_NAV,
      ...CHAT_NAV,
      ...NOTIFICATIONS_NAV,
    ],
  },
  {
    title: "Components",
    items: [
      { id: "area", label: "Area Chart" },
      { id: "line", label: "Line Chart" },
      { id: "bar", label: "Bar Chart" },
      { id: "pie", label: "Pie Chart" },
      { id: "radar", label: "Radar Chart" },
      { id: "sparkline", label: "Sparkline" },
      { id: "button", label: "Button" },
      { id: "avatar", label: "Avatar" },
      { id: "gradient", label: "Gradient" },
      { id: "image", label: "Image" },
      ...FORM_NAV,
      ...FIELD_NAV,
      ...SELECTION_NAV,
      ...FEEDBACK_NAV,
      ...STRUCTURE_NAV,
      ...LAYOUT_NAV,
      ...MEDIA_NAV,
      ...OVERLAY_NAV,
      ...SURFACE_NAV,
      ...NAVIGATION_NAV,
    ],
  },
  {
    title: "Backgrounds",
    items: [...BACKGROUNDS_NAV],
  },
  {
    title: "Text",
    items: [...TEXT_NAV],
  },
  {
    title: "Animations",
    items: [...ANIMATIONS_NAV],
  },
  { title: "Utils", items: [{ id: "palette", label: "Palette" }] },
]

export const SECTIONS = GROUPS.flatMap((g) => g.items)
