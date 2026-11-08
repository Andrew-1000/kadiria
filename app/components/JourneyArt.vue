<script setup lang="ts">
/**
 * A house that builds itself up with the construction journey:
 * 1 a pencil sketch on a pegged plot, 2 dimensioned drawings with an approval stamp, 3 foundations,
 * rising walls and materials, 4 full walls and a bill of quantities, 5 the bill checked and stamped,
 * 6 the finished house. Parts appear with a short rise-in animation as the stage changes.
 */
const props = defineProps<{ stage: JourneyStage['key'] }>()
const n = computed(() => journeyStage(props.stage).no)
const uid = useId()

// Walls: x 90–230, ground at y 170; block courses 7 high with staggered joints
const WALL = { x: 90, w: 140, ground: 170, top: 100 }
const courses = computed(() => {
  const top = n.value >= 4 ? WALL.top : 128
  const rows: { y: number, joints: number[] }[] = []
  for (let y = WALL.ground - 7, i = 0; y >= top - 0.1; y -= 7, i++) {
    const joints: number[] = []
    for (let x = WALL.x + (i % 2 ? 10 : 20); x < WALL.x + WALL.w; x += 20) joints.push(x)
    rows.push({ y, joints })
  }
  return rows
})
const wallTop = computed(() => courses.value.at(-1)?.y ?? WALL.ground)
// Openings: two windows and a door
const WINDOWS = [{ x: 104, y: 112, w: 28, h: 24 }, { x: 188, y: 112, w: 28, h: 24 }]
const DOOR = { x: 150, y: 128, w: 20, h: 42 }
const clip = (r: { y: number, h: number }) => ({ y: Math.max(r.y, wallTop.value), h: r.y + r.h - Math.max(r.y, wallTop.value) })
</script>

<template>
  <svg viewBox="0 0 320 200" role="img" :aria-label="`Illustration of stage ${n}: ${journeyStage(stage).title}`" class="w-full h-auto">
    <defs>
      <pattern :id="`${uid}-grid`" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M10 0H0V10" fill="none" stroke="#3b82f6" stroke-opacity=".18" stroke-width=".6" />
      </pattern>
      <marker :id="`${uid}-arrow`" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 0L6 3L0 6z" fill="#2563eb" />
      </marker>
    </defs>

    <!-- 6: sky details -->
    <g v-if="n >= 6" class="art-in">
      <circle cx="272" cy="38" r="14" fill="#fbbf24" />
      <g stroke="#fbbf24" stroke-width="2" stroke-linecap="round">
        <path d="M272 14v-6M272 68v-6M248 38h-6M302 38h-6M255 21l-4-4M293 59l-4-4M289 21l4-4M251 59l4-4" />
      </g>
    </g>

    <!-- 2: blueprint sheet behind the drawing -->
    <g v-if="n === 2" class="art-in">
      <rect x="36" y="26" width="248" height="160" rx="4" fill="#3b82f6" fill-opacity=".07" stroke="#3b82f6" stroke-opacity=".4" />
      <rect x="36" y="26" width="248" height="160" rx="4" :fill="`url(#${uid}-grid)`" />
    </g>

    <!-- ground -->
    <path d="M14 170H306" stroke="currentColor" stroke-opacity=".35" stroke-width="1.5" />
    <g stroke="currentColor" stroke-opacity=".18" stroke-width="1">
      <path d="M24 176l-6 6M60 176l-6 6M260 176l-6 6M296 176l-6 6" />
    </g>

    <!-- 1: pencil sketch on a pegged plot -->
    <g v-if="n === 1" class="art-in" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="5 4" stroke-linecap="round">
      <rect x="90" y="100" width="140" height="70" />
      <path d="M80 100L160 55L240 100" />
      <rect x="150" y="128" width="20" height="42" />
      <rect x="104" y="112" width="28" height="24" />
      <rect x="188" y="112" width="28" height="24" />
    </g>
    <g v-if="n === 1" class="art-in">
      <path d="M58 158v14M262 158v14" stroke="#b45309" stroke-width="3" stroke-linecap="round" />
      <path d="M58 160H262" stroke="#b45309" stroke-opacity=".6" stroke-width="1" />
      <g transform="translate(244 54) rotate(40)">
        <rect x="0" y="-4" width="44" height="8" rx="1.5" fill="#f59e0b" />
        <rect x="36" y="-4" width="8" height="8" fill="#f472b6" />
        <path d="M0 -4L-10 0L0 4z" fill="#fde68a" />
        <path d="M-6.5 -1.3L-10 0L-6.5 1.3z" fill="#374151" />
      </g>
      <g transform="translate(34 104)">
        <ellipse cx="0" cy="14" rx="14" ry="4" fill="#d97706" />
        <ellipse cx="0" cy="9" rx="14" ry="4" fill="#f59e0b" />
        <ellipse cx="0" cy="4" rx="14" ry="4" fill="#fbbf24" />
        <text x="0" y="-6" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" fill-opacity=".7">KES ?</text>
      </g>
    </g>

    <!-- 2: measured drawing, dimensions and the county stamp -->
    <g v-if="n === 2" class="art-in" fill="none" stroke="#2563eb" stroke-width="1.3">
      <rect x="90" y="100" width="140" height="70" />
      <path d="M80 100L160 55L240 100" />
      <rect x="150" y="128" width="20" height="42" />
      <rect x="104" y="112" width="28" height="24" />
      <rect x="188" y="112" width="28" height="24" />
      <path d="M90 180V188M230 180V188" stroke-width="1" />
      <path d="M93 184H227" stroke-width="1" :marker-start="`url(#${uid}-arrow)`" :marker-end="`url(#${uid}-arrow)`" />
      <path d="M250 100v70" stroke-width="1" :marker-start="`url(#${uid}-arrow)`" :marker-end="`url(#${uid}-arrow)`" />
    </g>
    <g v-if="n === 2" class="art-in">
      <text x="160" y="196" text-anchor="middle" font-size="8" fill="#2563eb">12.0 m</text>
      <text x="256" y="138" font-size="8" fill="#2563eb">3.0 m</text>
      <g transform="translate(66 62) rotate(-14)">
        <circle r="20" fill="none" stroke="#dc2626" stroke-width="2" />
        <circle r="16" fill="none" stroke="#dc2626" stroke-width=".8" />
        <text y="2.5" text-anchor="middle" font-size="5.4" font-weight="800" fill="#dc2626">APPROVED</text>
      </g>
    </g>

    <!-- 3+: foundation -->
    <g v-if="n >= 3" class="art-in">
      <rect x="84" y="170" width="152" height="12" fill="#9ca3af" />
      <rect x="84" y="170" width="152" height="12" fill="none" stroke="#6b7280" stroke-width=".8" />
    </g>

    <!-- 3+: block walls (half height at stage 3, full from stage 4) -->
    <g v-if="n >= 3" :key="n >= 4 ? 'full' : 'half'" class="art-in">
      <rect :x="WALL.x" :y="wallTop" :width="WALL.w" :height="WALL.ground - wallTop" fill="#d9c9a6" />
      <g stroke="#a8946d" stroke-width=".7">
        <path v-for="r in courses" :key="r.y" :d="`M${WALL.x} ${r.y}H${WALL.x + WALL.w}`" />
        <path v-for="r in courses" :key="`j${r.y}`" :d="r.joints.map(x => `M${x} ${r.y}v7`).join('')" />
      </g>
      <rect :x="WALL.x" :y="wallTop" :width="WALL.w" :height="WALL.ground - wallTop" fill="none" stroke="#8a7650" stroke-width="1" />
      <!-- openings: empty until the windows go in at stage 6 -->
      <template v-if="n < 6">
        <rect v-for="(w, i) in WINDOWS.filter(w => w.y + w.h > wallTop)" :key="i" :x="w.x" :y="clip(w).y" :width="w.w" :height="clip(w).h" fill="var(--ui-bg)" stroke="#8a7650" />
        <rect :x="DOOR.x" :y="clip(DOOR).y" :width="DOOR.w" :height="clip(DOOR).h" fill="var(--ui-bg)" stroke="#8a7650" />
      </template>
      <!-- ring beam on the full wall -->
      <rect v-if="n >= 4" x="88" y="96" width="144" height="6" fill="#9ca3af" stroke="#6b7280" stroke-width=".8" />
    </g>

    <!-- 3: materials on site -->
    <g v-if="n === 3" class="art-in">
      <path d="M22 170Q46 132 72 170Z" fill="#e8c872" stroke="#c9a74a" />
      <g v-for="(b, i) in [[246, 156], [270, 156], [258, 142]]" :key="i" :transform="`translate(${b[0]} ${b[1]})`">
        <rect width="22" height="14" rx="3" fill="#e5e7eb" stroke="#6b7280" />
        <rect y="5" width="22" height="3.5" fill="#2563eb" fill-opacity=".7" />
      </g>
    </g>

    <!-- 4–5: the bill of quantities -->
    <g v-if="n === 4 || n === 5" class="art-in">
      <g transform="translate(20 18) rotate(-4)">
        <rect width="86" height="104" rx="3" fill="#ffffff" stroke="#9ca3af" />
        <rect width="86" height="14" rx="3" fill="#0f766e" />
        <text x="7" y="10" font-size="7.5" font-weight="700" fill="#ffffff">BILL No. 3</text>
        <g v-for="i in 7" :key="i">
          <path :d="`M8 ${16 + i * 11}H48`" stroke="#9ca3af" stroke-width="2.4" stroke-linecap="round" />
          <path :d="`M58 ${16 + i * 11}H${70 + (i % 3) * 3}`" stroke="#374151" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" />
          <path v-if="n === 5" :d="`M74 ${14 + i * 11}l2.5 3 4-5.5`" fill="none" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </g>
      <g v-if="n === 5" transform="translate(92 106) rotate(-12)">
        <circle r="17" fill="#ffffff" fill-opacity=".85" stroke="#16a34a" stroke-width="2" />
        <text y="-1" text-anchor="middle" font-size="6.5" font-weight="800" fill="#16a34a">ISSUED</text>
        <text y="7" text-anchor="middle" font-size="5.5" font-weight="700" fill="#16a34a">REV 1</text>
      </g>
    </g>

    <!-- 6: the finished house -->
    <g v-if="n >= 6" class="art-in">
      <path d="M76 101L160 52L244 101Z" fill="#c2410c" stroke="#9a3412" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M100 87H220M124 73H196M148 59H172" stroke="#9a3412" stroke-opacity=".5" />
      <rect x="76" y="100" width="168" height="4" fill="#7c2d12" />
      <g v-for="(w, i) in WINDOWS" :key="i">
        <rect :x="w.x" :y="w.y" :width="w.w" :height="w.h" fill="#93c5fd" stroke="#374151" stroke-width="1.5" />
        <path :d="`M${w.x + w.w / 2} ${w.y}v${w.h}M${w.x} ${w.y + w.h / 2}h${w.w}`" stroke="#374151" />
      </g>
      <rect :x="DOOR.x" :y="DOOR.y" :width="DOOR.w" :height="DOOR.h" fill="#92400e" stroke="#451a03" stroke-width="1.2" />
      <circle :cx="DOOR.x + 15" :cy="DOOR.y + 23" r="1.4" fill="#fbbf24" />
      <path d="M140 170h40l4 6h-48z" fill="#9ca3af" />
      <rect x="34" y="128" width="5" height="42" fill="#78350f" />
      <circle cx="36" cy="118" r="20" fill="#16a34a" />
      <circle cx="26" cy="128" r="12" fill="#15803d" />
      <circle cx="48" cy="126" r="13" fill="#22c55e" />
      <circle cx="272" cy="165" r="7" fill="#15803d" /><circle cx="283" cy="163" r="9" fill="#22c55e" /><circle cx="294" cy="166" r="6" fill="#16a34a" />
    </g>
  </svg>
</template>

<style scoped>
.art-in {
  animation: art-rise 0.45s ease-out both;
}
@keyframes art-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .art-in {
    animation: none;
  }
}
</style>
