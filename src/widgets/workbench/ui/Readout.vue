<script setup lang="ts">
// The readout under the stage: what the tool in hand reads, in words, with
// its controls — the inspected box (box model, copy CSS / selector), type
// with its contrast grade, colour samples in every format, the a11y reading
// and the stage's audit, guides and the layout grid (placeable by keyboard),
// the pens, the selection, the comment threads, and a capture's result.
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { copyText } from "@dither-kit"
import { GIF } from "../bench"
import { useBench } from "../context"
import { copyImage, download, MAX_SECONDS, videoTypes } from "../model/capture"
import { COLOR_FORMATS, formatColor, grade } from "../model/color"
import { cssOf, selectorOf } from "../model/measure"
import { SWATCHES, swatch } from "../model/settings"
import { ICONS, toolById } from "../model/tools"
import { uid } from "../model/workspace"
import Icon from "./Icon.vue"

const b = useBench()
const tool = computed(() => (b.tool.value ? toolById(b.tool.value) : null))
const copy = async (text: string, what: string) => b.say((await copyText(text)) ? `Copied ${what}` : "Copy failed")

// --- inspect ---------------------------------------------------------------
const target = () => b.pinned.value ?? b.hovered.value
const r = computed(() => b.reading.value)
const content = computed(() => {
  const x = r.value
  if (!x) return null
  return {
    w: x.box.w - x.edge[1] - x.edge[3] - x.pad[1] - x.pad[3],
    h: x.box.h - x.edge[0] - x.edge[2] - x.pad[0] - x.pad[2],
  }
})
const fields = computed(() => {
  const x = r.value
  if (!x) return []
  return [
    ["at", `${x.box.x}, ${x.box.y}`],
    ["size", `${x.box.w}×${x.box.h}`],
    ["display", x.display],
    ["font", x.font],
    ["color", x.color],
    ["bg", x.background],
    ["radius", x.radius],
    ["padding", x.padding],
    ["margin", x.margin],
  ]
})

// --- type ------------------------------------------------------------------
const t = computed(() => b.typeReading.value)
const tGrade = computed(() => (t.value?.ratio ? grade(t.value.ratio, t.value.large) : null))

// --- colour ----------------------------------------------------------------
const hasDropper = typeof window !== "undefined" && "EyeDropper" in window

// --- guides ----------------------------------------------------------------
const guideAt = ref(0)
function addGuide() {
  const axis = b.guideAxis.value
  const at = Math.max(0, Math.round(guideAt.value))
  b.change((w) => w.guides.push({ id: uid("g"), axis, at }))
  b.say(`${axis === "x" ? "Vertical" : "Horizontal"} guide at ${at}`)
}
function removeGuide(id: string) {
  b.change((w) => (w.guides = w.guides.filter((g) => g.id !== id)))
}
function setGrid(key: "columns" | "gutter" | "margin" | "rows" | "rowGutter" | "pixel", value: number) {
  if (!Number.isFinite(value)) return
  b.change((w) => (w.grid[key] = Math.max(key === "gutter" || key === "rowGutter" || key === "margin" ? 0 : 1, value)))
}
function showGrid(key: "columns" | "rows" | "pixel", on: boolean) {
  b.change((w) => (w.grid.show[key] = on))
}

// --- comments --------------------------------------------------------------
const search = ref("")
const threads = computed(() => {
  const q = search.value.trim().toLowerCase()
  return [...b.ws.value.threads]
    .sort((p, q2) => p.n - q2.n)
    .filter(
      (th) =>
        !q || th.anchor.label.toLowerCase().includes(q) || th.messages.some((m) => m.text.toLowerCase().includes(q)),
    )
})

// --- capture ---------------------------------------------------------------
/** WebM / MP4 as the browser records them, and a GIF dithered by the kit. */
const types = [...videoTypes(), { mime: GIF, ext: "gif", label: "GIF" }]
const elapsed = ref(0)
let tick = 0
watch(
  () => b.capture.value?.kind,
  (kind) => {
    clearInterval(tick)
    if (kind === "recording") {
      tick = window.setInterval(() => {
        const c = b.capture.value
        elapsed.value = c?.kind === "recording" ? c.rec.elapsed() : 0
      }, 250)
    }
  },
)
onBeforeUnmount(() => clearInterval(tick))
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
function trim(which: "start" | "end", value: number) {
  const c = b.capture.value
  if (c?.kind !== "video") return
  b.capture.value =
    which === "start" ? { ...c, start: Math.min(value, c.end - 0.1) } : { ...c, end: Math.max(value, c.start + 0.1) }
}
function saveShot() {
  const c = b.capture.value
  if (c?.kind === "shot") download(c.blob, `${b.o.key.replace(/[^\w-]+/g, "-")}.png`)
}
async function copyShot() {
  const c = b.capture.value
  if (c?.kind !== "shot") return
  b.say((await copyImage(c.blob)) ? "Copied the image" : "This browser cannot copy images — download it instead")
}
</script>

<template>
  <section class="wb-readout" :aria-label="`Workbench — ${tool?.label ?? 'no tool'}`">
    <header class="top">
      <span class="micro name">{{ tool?.label ?? "No tool" }}</span>
      <span class="hint">{{
        tool?.hint ??
        "pick a tool in the tray — I inspects, X shows structure, M comments, K copies it all for an agent"
      }}</span>
    </header>

    <!-- Inspect / X-ray -->
    <div v-if="(b.tool.value === 'inspect' || b.tool.value === 'xray') && r" class="body">
      <div class="row">
        <span class="label">{{ b.pinned.value ? "pinned" : "pointing" }}</span>
        <strong>{{ r.label }}</strong>
        <span class="spacer" />
        <button type="button" class="act" @click="target() && copy(cssOf(target()!), 'the CSS')">Copy CSS</button>
        <button type="button" class="act" @click="target() && copy(selectorOf(target()!, b.o.content), 'the selector')">
          Copy selector
        </button>
      </div>
      <div class="split">
        <dl class="fields">
          <div v-for="[k, v] in fields" :key="k">
            <dt class="micro">{{ k }}</dt>
            <dd><i v-if="k === 'color' || k === 'bg'" class="sw" :style="{ background: v }" />{{ v }}</dd>
          </div>
          <div v-if="r.gaps.length">
            <dt class="micro">gaps</dt>
            <dd>{{ r.gaps.map((g) => Math.min(g.w, g.h)).join(", ") }}</dd>
          </div>
        </dl>
        <div class="model" aria-label="Box model">
          <div class="m">
            <span class="micro tag">margin</span>
            <span class="v t">{{ r.outer[0] }}</span
            ><span class="v r">{{ r.outer[1] }}</span
            ><span class="v b">{{ r.outer[2] }}</span
            ><span class="v l">{{ r.outer[3] }}</span>
            <div class="e">
              <span class="micro tag">border</span>
              <span class="v t">{{ r.edge[0] }}</span
              ><span class="v r">{{ r.edge[1] }}</span
              ><span class="v b">{{ r.edge[2] }}</span
              ><span class="v l">{{ r.edge[3] }}</span>
              <div class="p">
                <span class="micro tag">padding</span>
                <span class="v t">{{ r.pad[0] }}</span
                ><span class="v r">{{ r.pad[1] }}</span
                ><span class="v b">{{ r.pad[2] }}</span
                ><span class="v l">{{ r.pad[3] }}</span>
                <div class="c">{{ content?.w }}×{{ content?.h }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-if="b.altMeasure.value" class="row">
        <span class="label">alt</span>
        {{ b.altMeasure.value.fromLabel }} → {{ b.altMeasure.value.toLabel }}:
        {{
          b.altMeasure.value.segments
            .filter((s) => !s.dashed)
            .map((s) => s.value)
            .join(" · ") || "touching"
        }}
        <span class="dim">· Alt+S keeps it</span>
      </p>
    </div>

    <!-- X-ray summary -->
    <p v-if="b.tool.value === 'xray'" class="row dim">
      {{ b.xray.value.length }} elements · {{ b.xray.value.filter((x) => x.layout).length }} flex/grid (dashed) · depth
      {{ Math.max(0, ...b.xray.value.map((x) => x.depth)) + 1 }}
    </p>

    <!-- Typography -->
    <div v-if="b.tool.value === 'type' && t" class="body">
      <div class="row">
        <span class="label">{{ b.pinned.value ? "pinned" : "pointing" }}</span
        ><strong>{{ t.label }}</strong>
      </div>
      <dl class="fields">
        <div>
          <dt class="micro">family</dt>
          <dd>
            {{ t.rendered }} <span class="dim">of {{ t.family }}</span>
          </dd>
        </div>
        <div>
          <dt class="micro">size</dt>
          <dd>{{ t.size }} / {{ t.lineHeight }}</dd>
        </div>
        <div>
          <dt class="micro">weight</dt>
          <dd>{{ t.weight }}</dd>
        </div>
        <div>
          <dt class="micro">tracking</dt>
          <dd>{{ t.letterSpacing }}</dd>
        </div>
        <div v-if="t.transform !== 'none'">
          <dt class="micro">case</dt>
          <dd>{{ t.transform }}</dd>
        </div>
        <div>
          <dt class="micro">lines</dt>
          <dd>{{ t.lines.length }} · ~{{ t.measure }} ch</dd>
        </div>
        <div>
          <dt class="micro">ink</dt>
          <dd>
            <i class="sw" :style="{ background: t.color ? formatColor(t.color, 'hex') : 'transparent' }" />{{
              t.color ? formatColor(t.color, "hex") : "—"
            }}
          </dd>
        </div>
        <div>
          <dt class="micro">ground</dt>
          <dd>
            <i class="sw" :style="{ background: t.background ? formatColor(t.background, 'hex') : 'transparent' }" />{{
              t.background ? formatColor(t.background, "hex") : "image or gradient"
            }}
          </dd>
        </div>
        <div>
          <dt class="micro">contrast</dt>
          <dd v-if="t.ratio && tGrade">
            {{ t.ratio }}:1
            <span class="grade" :class="{ pass: tGrade.aa }">AA {{ tGrade.aa ? "pass" : "fail" }}</span>
            <span class="grade" :class="{ pass: tGrade.aaa }">AAA {{ tGrade.aaa ? "pass" : "fail" }}</span>
            <span class="dim">{{ t.large ? "large text" : "body text" }}</span>
          </dd>
          <dd v-else class="dim">not knowable over an image</dd>
        </div>
      </dl>
    </div>

    <!-- Colour samples -->
    <div v-if="b.tool.value === 'color' || b.tool.value === 'loupe'" class="body">
      <div class="row">
        <span class="label">copy as</span>
        <div class="seg" role="group" aria-label="Colour format">
          <button
            v-for="f in COLOR_FORMATS"
            :key="f"
            type="button"
            :aria-pressed="b.settings.format === f"
            @click="b.settings.format = f"
          >
            {{ f }}
          </button>
        </div>
        <span class="spacer" />
        <button v-if="hasDropper" type="button" class="act" @click="b.eyeDropper()">Screen picker</button>
      </div>
      <template v-if="b.samples.value.length">
        <dl class="fields">
          <div v-for="f in COLOR_FORMATS" :key="f">
            <dt class="micro">{{ f }}</dt>
            <dd>
              <button type="button" class="value" @click="copy(formatColor(b.samples.value[0], f), f)">
                <i v-if="f === 'hex'" class="sw" :style="{ background: formatColor(b.samples.value[0], 'hex') }" />{{
                  formatColor(b.samples.value[0], f)
                }}
              </button>
            </dd>
          </div>
        </dl>
        <div class="row" role="list" aria-label="Recent samples">
          <button
            v-for="(c, i) in b.samples.value"
            :key="i"
            type="button"
            role="listitem"
            class="chipsw"
            :style="{ background: formatColor(c, 'hex') }"
            :aria-label="`Copy ${formatColor(c, b.settings.format)}`"
            @click="b.addSample(c)"
          />
        </div>
      </template>
      <p v-else class="dim">no samples yet</p>
    </div>

    <!-- Accessibility -->
    <div v-if="b.tool.value === 'a11y'" class="body">
      <dl v-if="b.a11y.value" class="fields">
        <div>
          <dt class="micro">element</dt>
          <dd>{{ b.a11y.value.label }}</dd>
        </div>
        <div>
          <dt class="micro">role</dt>
          <dd>{{ b.a11y.value.role }}</dd>
        </div>
        <div>
          <dt class="micro">name</dt>
          <dd :class="{ warn: b.a11y.value.control && !b.a11y.value.name }">{{ b.a11y.value.name || "none" }}</dd>
        </div>
        <div v-if="b.a11y.value.states.length">
          <dt class="micro">states</dt>
          <dd>{{ b.a11y.value.states.join(" · ") }}</dd>
        </div>
        <div>
          <dt class="micro">tab</dt>
          <dd>{{ b.a11y.value.tabindex === null ? "not focusable" : `tabindex ${b.a11y.value.tabindex}` }}</dd>
        </div>
        <div>
          <dt class="micro">target</dt>
          <dd :class="{ warn: b.a11y.value.control && (b.a11y.value.box.w < 24 || b.a11y.value.box.h < 24) }">
            {{ b.a11y.value.box.w }}×{{ b.a11y.value.box.h }}
          </dd>
        </div>
      </dl>
      <p class="row">
        <span class="label">stage</span>
        {{ b.order.value.length }} tab stops · {{ b.marks.value.length }} issue{{
          b.marks.value.length === 1 ? "" : "s"
        }}
      </p>
      <ul v-if="b.marks.value.length" class="issues">
        <li v-for="(m, i) in b.marks.value" :key="i">
          <span class="grade">{{ m.kind }}</span> {{ m.note }}
        </li>
      </ul>
    </div>

    <!-- Guides and the layout grid -->
    <div v-if="b.tool.value === 'guides'" class="body">
      <form class="row" @submit.prevent="addGuide">
        <div class="seg" role="group" aria-label="Guide direction">
          <button type="button" :aria-pressed="b.guideAxis.value === 'x'" @click="b.guideAxis.value = 'x'">
            vertical · V
          </button>
          <button type="button" :aria-pressed="b.guideAxis.value === 'y'" @click="b.guideAxis.value = 'y'">
            horizontal · H
          </button>
        </div>
        <label class="num">at <input v-model.number="guideAt" type="number" min="0" :max="9999" /> px</label>
        <button type="submit" class="act">Add guide</button>
      </form>
      <ul v-if="b.ws.value.guides.length" class="tags">
        <li v-for="g in b.ws.value.guides" :key="g.id">
          {{ g.axis === "x" ? "│" : "─" }} {{ Math.round(g.at) }}
          <button
            type="button"
            class="x"
            :aria-label="`Remove the guide at ${Math.round(g.at)}`"
            @click="removeGuide(g.id)"
          >
            <Icon :d="ICONS.close" :size="10" />
          </button>
        </li>
      </ul>
      <div class="grid-ctl">
        <label class="check"
          ><input
            type="checkbox"
            :checked="b.ws.value.grid.show.columns"
            @change="showGrid('columns', ($event.target as HTMLInputElement).checked)"
          />
          columns</label
        >
        <label class="num"
          ><input
            type="number"
            min="1"
            max="48"
            :value="b.ws.value.grid.columns"
            aria-label="Column count"
            @change="setGrid('columns', +($event.target as HTMLInputElement).value)"
        /></label>
        <label class="num"
          >gutter
          <input
            type="number"
            min="0"
            :value="b.ws.value.grid.gutter"
            @change="setGrid('gutter', +($event.target as HTMLInputElement).value)"
        /></label>
        <label class="num"
          >margin
          <input
            type="number"
            min="0"
            :value="b.ws.value.grid.margin"
            @change="setGrid('margin', +($event.target as HTMLInputElement).value)"
        /></label>
        <label class="check"
          ><input
            type="checkbox"
            :checked="b.ws.value.grid.show.rows"
            @change="showGrid('rows', ($event.target as HTMLInputElement).checked)"
          />
          rows</label
        >
        <label class="num"
          ><input
            type="number"
            min="1"
            max="48"
            :value="b.ws.value.grid.rows"
            aria-label="Row count"
            @change="setGrid('rows', +($event.target as HTMLInputElement).value)"
        /></label>
        <label class="num"
          >gutter
          <input
            type="number"
            min="0"
            :value="b.ws.value.grid.rowGutter"
            aria-label="Row gutter"
            @change="setGrid('rowGutter', +($event.target as HTMLInputElement).value)"
        /></label>
        <label class="check"
          ><input
            type="checkbox"
            :checked="b.ws.value.grid.show.pixel"
            @change="showGrid('pixel', ($event.target as HTMLInputElement).checked)"
          />
          pixel grid</label
        >
        <label class="num"
          ><input
            type="number"
            min="2"
            max="128"
            :value="b.ws.value.grid.pixel"
            aria-label="Pixel grid size"
            @change="setGrid('pixel', +($event.target as HTMLInputElement).value)"
          />
          px</label
        >
      </div>
    </div>

    <!-- Pens -->
    <div v-if="b.tool.value === 'pen' || b.tool.value === 'eraser'" class="body">
      <div class="row">
        <div class="seg" role="group" aria-label="Pen">
          <button type="button" :aria-pressed="b.settings.pen === 'ink'" @click="b.settings.pen = 'ink'">ink</button>
          <button type="button" :aria-pressed="b.settings.pen === 'marker'" @click="b.settings.pen = 'marker'">
            marker
          </button>
        </div>
        <label v-if="b.settings.pen === 'ink'" class="num"
          >width <input v-model.number="b.settings.inkWidth" type="range" min="1" max="24" />
          {{ b.settings.inkWidth }}</label
        >
        <label v-else class="num"
          >width <input v-model.number="b.settings.markerWidth" type="range" min="4" max="48" />
          {{ b.settings.markerWidth }}</label
        >
      </div>
      <div class="row" role="radiogroup" :aria-label="`${b.settings.pen} colour`">
        <button
          v-for="s in SWATCHES"
          :key="s"
          type="button"
          role="radio"
          class="chipsw"
          :aria-checked="(b.settings.pen === 'ink' ? b.settings.inkSwatch : b.settings.markerSwatch) === s"
          :aria-label="s"
          :style="{ background: swatch(s) }"
          @click="b.settings.pen === 'ink' ? (b.settings.inkSwatch = s) : (b.settings.markerSwatch = s)"
        />
      </div>
    </div>

    <!-- Arrows and notes take the annotate colour -->
    <div
      v-if="b.tool.value === 'arrow' || b.tool.value === 'text'"
      class="row"
      role="radiogroup"
      aria-label="Annotation colour"
    >
      <button
        v-for="s in SWATCHES"
        :key="s"
        type="button"
        role="radio"
        class="chipsw"
        :aria-checked="b.settings.annotate === s"
        :aria-label="s"
        :style="{ background: swatch(s) }"
        @click="b.settings.annotate = s"
      />
    </div>

    <!-- Selection -->
    <div v-if="b.tool.value === 'select'" class="row">
      <span class="label">selected</span> {{ b.selection.value.length }}
      <span class="spacer" />
      <button type="button" class="act" :disabled="!b.selection.value.length" @click="b.removeSelection()">
        Delete
      </button>
      <button type="button" class="act" @click="b.clearAll()">Clear all</button>
    </div>

    <!-- Comments -->
    <div v-if="b.tool.value === 'comment'" class="body">
      <div class="row">
        <input v-model="search" type="search" class="search" placeholder="Search threads" aria-label="Search threads" />
        <span class="spacer" />
        <button type="button" class="act" @click="b.copyForAgent()">Copy for agent · K</button>
      </div>
      <ol v-if="threads.length" class="threads">
        <li v-for="th in threads" :key="th.id">
          <button type="button" class="thread" :class="{ resolved: th.resolved }" @click="b.openThread.value = th.id">
            <span class="n">{{ th.n }}</span>
            <span class="what">{{ th.messages[0]?.text }}</span>
            <span class="dim"
              >{{ th.anchor.label }}{{ th.resolved ? " · resolved" : "" }} · {{ th.messages.length }}</span
            >
          </button>
        </li>
      </ol>
      <p v-else class="dim">{{ search ? "no thread matches" : "no threads yet — click an element on the stage" }}</p>
    </div>

    <!-- Capture -->
    <div v-if="b.capture.value" class="body">
      <div v-if="b.capture.value.kind === 'recording'" class="row">
        <span class="rec" aria-hidden="true" />
        <span>Recording {{ clock(elapsed) }} / {{ clock(MAX_SECONDS) }}</span>
        <span class="spacer" />
        <button type="button" class="act primary" @click="b.finishRecording()">
          <Icon :d="ICONS.stop" :size="12" /> Stop · Esc
        </button>
      </div>
      <template v-else-if="b.capture.value.kind === 'shot'">
        <img :src="b.capture.value.url" alt="The captured region" class="shot" />
        <div class="row">
          <button type="button" class="act" @click="copyShot"><Icon :d="ICONS.copy" :size="12" /> Copy</button>
          <button type="button" class="act" @click="saveShot"><Icon :d="ICONS.download" :size="12" /> Download</button>
          <span class="spacer" />
          <button type="button" class="act" @click="b.discardCapture()">Discard</button>
        </div>
      </template>
      <template v-else-if="b.capture.value.kind === 'video'">
        <video :src="b.capture.value.url" class="shot" controls muted playsinline aria-label="The recording" />
        <div class="row">
          <label class="num"
            >in
            <input
              type="range"
              min="0"
              :max="b.capture.value.duration"
              step="0.1"
              :value="b.capture.value.start"
              aria-label="Trim start"
              @input="trim('start', +($event.target as HTMLInputElement).value)"
            />
            {{ b.capture.value.start.toFixed(1) }}s</label
          >
          <label class="num"
            >out
            <input
              type="range"
              min="0"
              :max="b.capture.value.duration"
              step="0.1"
              :value="b.capture.value.end"
              aria-label="Trim end"
              @input="trim('end', +($event.target as HTMLInputElement).value)"
            />
            {{ b.capture.value.end.toFixed(1) }}s</label
          >
        </div>
        <div class="row">
          <div class="seg" role="group" aria-label="Export format">
            <button
              v-for="v in types"
              :key="v.mime"
              type="button"
              :aria-pressed="b.videoMime.value === v.mime"
              @click="b.videoMime.value = v.mime"
            >
              {{ v.label }}
            </button>
          </div>
          <span class="spacer" />
          <button type="button" class="act primary" :disabled="b.busy.value" @click="b.exportVideo()">
            <Icon :d="ICONS.download" :size="12" />
            {{ b.busy.value ? "Encoding…" : b.videoMime.value === GIF ? "Save GIF" : "Save video" }}
          </button>
          <button type="button" class="act" @click="b.discardCapture()">Discard</button>
        </div>
      </template>
    </div>

    <p class="status" role="status" aria-live="polite">{{ b.status.value }}</p>
  </section>
</template>

<style scoped>
.wb-readout {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
  border-radius: 8px;
  font-size: 11px;
  color: var(--color-foreground);
}

.top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.name {
  color: var(--color-foreground);
}

.hint,
.dim,
.label {
  color: var(--color-muted-foreground);
}

.label {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
}

.spacer {
  flex: 1;
}

.split {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.fields {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin: 0;
}

.fields > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.fields dt {
  color: var(--color-muted-foreground);
}

.fields dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.warn {
  color: var(--swatch-orange);
}

.sw {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 6px;
  vertical-align: -1px;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 30%, transparent);
}

.act,
.seg > button,
.value {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 11px;
  color: var(--color-muted-foreground);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.value {
  padding: 0 6px;
  box-shadow: none;
  color: var(--color-foreground);
}

.act:hover:not(:disabled),
.seg > button:hover,
.value:hover {
  color: var(--color-foreground);
}

.act.primary {
  color: var(--color-background);
  background: var(--color-foreground);
  box-shadow: none;
}

.act:disabled {
  opacity: 0.4;
}

.seg {
  display: flex;
  gap: 3px;
}

.seg > button {
  box-shadow: none;
}

.seg > button[aria-pressed="true"] {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}

.chipsw {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 25%, transparent);
}

.chipsw[aria-checked="true"] {
  outline: 2px solid var(--color-foreground);
  outline-offset: 2px;
}

.grade {
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 10px;
  color: var(--color-background);
  background: var(--swatch-orange);
}

.grade.pass {
  color: var(--color-foreground);
  background: none;
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.issues,
.threads,
.tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tags {
  flex-direction: row;
  flex-wrap: wrap;
}

.tags > li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 6px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.x {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  color: var(--color-muted-foreground);
}

.thread {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  min-height: 26px;
  padding: 2px 6px;
  border-radius: 5px;
  text-align: left;
}

.thread:hover {
  background: color-mix(in oklab, var(--color-foreground) 5%, transparent);
}

.thread .n {
  color: var(--swatch-orange);
}

.thread.resolved .n {
  color: var(--color-muted-foreground);
}

.thread .what {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.num,
.check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-muted-foreground);
}

.num input[type="number"],
.search {
  width: 64px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  font: inherit;
  color: var(--color-foreground);
  background: var(--color-card);
}

.search {
  width: 200px;
}

.grid-ctl {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  align-items: center;
}

.model {
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted-foreground);
}

.m,
.e,
.p {
  position: relative;
  padding: 16px 22px;
}

.m {
  border: 1px dashed color-mix(in oklab, var(--swatch-orange) 50%, transparent);
}

.e {
  border: 1px solid var(--color-border);
}

.p {
  background: color-mix(in oklab, var(--swatch-orange) 10%, transparent);
}

.c {
  min-width: 96px;
  padding: 4px 8px;
  text-align: center;
  white-space: nowrap;
  color: var(--color-foreground);
  background: var(--color-card);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.tag {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 8px;
  letter-spacing: 0.12em;
}

.v {
  position: absolute;
}

.v.t {
  top: 2px;
  left: 50%;
}

.v.b {
  bottom: 2px;
  left: 50%;
}

.v.l {
  top: 50%;
  left: 6px;
  transform: translateY(-50%);
}

.v.r {
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
}

.shot {
  max-width: 100%;
  max-height: 220px;
  align-self: flex-start;
  border-radius: 6px;
  box-shadow: 0 0 0 1px var(--color-border);
}

.rec {
  width: 8px;
  height: 8px;
  background: var(--swatch-orange);
}

@media (prefers-reduced-motion: no-preference) {
  .rec {
    animation: rec 1s steps(2) infinite;
  }
}

@keyframes rec {
  50% {
    opacity: 0.2;
  }
}

.status {
  margin: 0;
  color: var(--color-muted-foreground);
}
</style>
