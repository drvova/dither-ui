import type { ChartConfig } from "../components/dither-kit"

export const trafficData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 173, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 314, mobile: 250 },
  { month: "Jul", desktop: 268, mobile: 210 },
  { month: "Aug", desktop: 342, mobile: 290 },
]

export const trafficConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "blue" },
  mobile: { label: "Mobile", color: "purple" },
}

export const revenueData = [
  { quarter: "Q1", product: 120, services: 60 },
  { quarter: "Q2", product: 190, services: 110 },
  { quarter: "Q3", product: 150, services: 130 },
  { quarter: "Q4", product: 240, services: 170 },
]

export const revenueConfig: ChartConfig = {
  product: { label: "Product", color: "green" },
  services: { label: "Services", color: "orange" },
}

export const marketData = [
  { name: "chrome", value: 63 },
  { name: "safari", value: 19 },
  { name: "firefox", value: 9 },
  { name: "edge", value: 6 },
  { name: "other", value: 3 },
]

export const marketConfig: ChartConfig = {
  chrome: { label: "Chrome", color: "blue" },
  safari: { label: "Safari", color: "green" },
  firefox: { label: "Firefox", color: "orange" },
  edge: { label: "Edge", color: "purple" },
  other: { label: "Other", color: "grey" },
}

export const skillData = [
  { axis: "Speed", alpha: 90, beta: 60 },
  { axis: "Power", alpha: 70, beta: 85 },
  { axis: "Range", alpha: 55, beta: 75 },
  { axis: "Focus", alpha: 80, beta: 50 },
  { axis: "Craft", alpha: 95, beta: 65 },
  { axis: "Flow", alpha: 65, beta: 80 },
]

export const skillConfig: ChartConfig = {
  alpha: { label: "Alpha", color: "pink" },
  beta: { label: "Beta", color: "blue" },
}

export const sparkSeries = [4, 9, 6, 12, 8, 15, 11, 18, 14, 22, 19, 26]

export const avatarNames = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Dennis Ritchie",
  "Barbara Liskov",
]
