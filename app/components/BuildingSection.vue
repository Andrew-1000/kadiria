<script setup lang="ts">
import { MODULES } from '#shared/calc/modules'

/**
 * Static section drawing for reports and print: the given stage is highlighted, stages built
 * before it are drawn solid, later stages faintly. Fixed colours so it prints the same in any theme.
 */
const props = withDefaults(defineProps<{
  /** Module key of the stage to highlight, e.g. 'strip_footing' */
  highlight: string
  /** Number shown in the highlighted bubble (defaults to its position in the site sequence) */
  number?: number
  /** Show the faint outline of later stages (default true) */
  showLater?: boolean
}>(), { number: undefined, showLater: true })

const uid = useId()
const ORDER = MODULES.map(m => m.key)
const at = computed(() => ORDER.indexOf(props.highlight))
const bubble = computed(() => props.number ?? (at.value >= 0 ? at.value + 1 : undefined))

type State = 'built' | 'current' | 'later'
const parts = computed(() => SECTION_PARTS.map((p) => {
  const i = ORDER.indexOf(p.key)
  const state: State = p.key === props.highlight ? 'current' : i >= 0 && at.value >= 0 && i < at.value ? 'built' : 'later'
  return { ...p, state }
}).filter(p => props.showLater || p.state !== 'later')
  // current stage on top
  .sort((a, b) => (a.state === 'current' ? 1 : 0) - (b.state === 'current' ? 1 : 0)))

const C = { line: '#64748b', built: '#e2e8f0', builtLine: '#64748b', current: '#2563eb', currentFill: 'rgba(37, 99, 235, 0.45)', later: '#94a3b8', soil: '#94a3b8' }
function fill(p: { kind?: string, state: State }) {
  if (p.kind === 'thin') return 'none'
  if (p.state === 'later') return 'none'
  if (p.kind === 'hatch') return `url(#${uid}-hatch)`
  if (p.kind === 'stones') return p.state === 'current' ? `url(#${uid}-stones-c)` : `url(#${uid}-stones)`
  return p.state === 'current' ? C.currentFill : C.built
}
const stroke = (s: State) => s === 'current' ? C.current : s === 'built' ? C.builtLine : C.later
</script>

<template>
  <svg viewBox="0 -4 640 380" class="w-full h-auto" role="img" :aria-label="`Section drawing with the ${highlight.replace(/_/g, ' ')} stage highlighted`">
    <defs>
      <pattern :id="`${uid}-hatch`" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" :fill="parts.find(p => p.key === 'hardcore')?.state === 'current' ? C.currentFill : C.built" />
        <line x1="0" y1="0" x2="0" y2="7" :stroke="C.line" stroke-width="1.2" />
      </pattern>
      <pattern :id="`${uid}-stones`" width="18" height="10" patternUnits="userSpaceOnUse">
        <rect width="18" height="10" :fill="C.built" />
        <rect x="0.5" y="0.5" width="17" height="9" fill="none" :stroke="C.line" stroke-width="0.8" />
      </pattern>
      <pattern :id="`${uid}-stones-c`" width="18" height="10" patternUnits="userSpaceOnUse">
        <rect width="18" height="10" :fill="C.currentFill" />
        <rect x="0.5" y="0.5" width="17" height="9" fill="none" :stroke="C.current" stroke-width="0.8" />
      </pattern>
      <pattern :id="`${uid}-soil`" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="0.9" :fill="C.soil" />
        <circle cx="10" cy="10" r="0.9" :fill="C.soil" />
      </pattern>
    </defs>

    <!-- ground -->
    <rect x="0" :y="SECTION_GROUND_Y" width="640" :height="376 - SECTION_GROUND_Y" :fill="`url(#${uid}-soil)`" opacity="0.6" />
    <line x1="0" :y1="SECTION_GROUND_Y" x2="640" :y2="SECTION_GROUND_Y" :stroke="C.line" stroke-width="2" />
    <text x="8" :y="SECTION_GROUND_Y - 6" font-size="10" font-family="ui-monospace, monospace" :fill="C.line">GL</text>

    <g v-for="p in parts" :key="p.key" :opacity="p.state === 'later' ? 0.35 : 1">
      <path
        v-for="(d, i) in p.shapes"
        :key="i"
        :d="d"
        :fill="fill(p)"
        :stroke="stroke(p.state)"
        :stroke-width="p.state === 'current' ? 3 : 1.4"
        :stroke-dasharray="p.kind === 'thin' || p.state === 'later' ? '5 4' : undefined"
      />
      <template v-if="p.state === 'current'">
        <line :x1="p.bubble[0]" :y1="p.bubble[1]" :x2="p.anchor[0]" :y2="p.anchor[1]" :stroke="C.current" stroke-width="2" />
        <circle :cx="p.bubble[0]" :cy="p.bubble[1]" r="21" :fill="C.current" stroke="#fff" stroke-width="2" />
        <text :x="p.bubble[0]" :y="p.bubble[1] + 7" text-anchor="middle" font-size="20" font-weight="700" font-family="ui-monospace, monospace" fill="#fff">
          {{ bubble ?? '•' }}
        </text>
      </template>
    </g>
  </svg>
</template>
