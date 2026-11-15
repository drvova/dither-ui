import { createSignal, For } from "solid-js"
import { DitherAvatar, DitherMenu, DitherSidebar, DitherSidebarGroup, DitherSidebarItem } from "@dither-kit"

/* Team switcher */
type Team = {
  color: "blue" | "green" | "purple"
  plan: string
  groups: Record<string, { label: string; badge?: number }[]>
}

const TEAMS: Record<string, Team> = {
  "Acme Inc": {
    color: "blue",
    plan: "Enterprise",
    groups: {
      Product: [{ label: "Roadmap" }, { label: "Releases", badge: 3 }, { label: "Feedback" }],
      Ops: [{ label: "Billing" }, { label: "Members", badge: 24 }],
    },
  },
  "Pixel Labs": {
    color: "purple",
    plan: "Startup",
    groups: {
      Research: [{ label: "Experiments", badge: 7 }, { label: "Datasets" }, { label: "Notebooks" }],
      Studio: [{ label: "Prototypes" }, { label: "Reviews", badge: 2 }],
    },
  },
  "Zine Press": {
    color: "green",
    plan: "Indie",
    groups: {
      Issues: [{ label: "Drafts", badge: 4 }, { label: "Published" }],
      Shop: [{ label: "Orders", badge: 12 }, { label: "Stock" }],
    },
  },
}

export default function Example() {
  const teamNames = Object.keys(TEAMS)
  const [team, setTeam] = createSignal(teamNames[0])
  const [teamActive, setTeamActive] = createSignal("Roadmap")
  function switchTeam(name: string) {
    if (!TEAMS[name]) return
    setTeam(name)
    setTeamActive(Object.values(TEAMS[name].groups)[0][0].label)
  }

  // the workspace menu really switches
  return (
    <div class="overflow-x-auto">
      <div class="mx-auto flex h-96 min-w-[36rem] max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar
          class="w-60"
          label="Workspace nav"
          variant="washed"
          washColor={TEAMS[team()].color}
          collapse="none"
          header={
            <DitherMenu items={teamNames.map((n) => ({ label: n }))} onSelect={switchTeam}>
              <span class="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5 text-left transition-colors hover:bg-card">
                <DitherAvatar name={team()} size={22} color={TEAMS[team()].color} />
                <span class="min-w-0 flex-1 leading-tight">
                  <span class="block truncate text-[11px] text-foreground">{team()}</span>
                  <span class="block truncate text-[9px] text-muted-foreground">{TEAMS[team()].plan}</span>
                </span>
                <span class="text-[10px] text-muted-foreground" aria-hidden="true">
                  ⇅
                </span>
              </span>
            </DitherMenu>
          }
        >
          <For each={Object.keys(TEAMS[team()].groups)}>
            {(group) => (
              <DitherSidebarGroup label={group}>
                <For each={TEAMS[team()].groups[group]}>
                  {(i) => (
                    <DitherSidebarItem
                      label={i.label}
                      badge={i.badge}
                      color={TEAMS[team()].color}
                      active={teamActive() === i.label}
                      onSelect={() => setTeamActive(i.label)}
                    />
                  )}
                </For>
              </DitherSidebarGroup>
            )}
          </For>
        </DitherSidebar>
        <div class="grid min-w-0 flex-1 place-items-center">
          <div class="text-center">
            <div class="text-[11px] text-muted-foreground">{team()}</div>
            <div class="mt-1 text-[13px] text-foreground">{teamActive()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
