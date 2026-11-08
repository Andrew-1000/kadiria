<script setup lang="ts">
// The construction guide is part of the signed-in workspace; the public site stays simple
const { loggedIn: showGuide } = useUserSession()
/**
 * Slim "you are here" bar on the tool pages: back to wherever the user came from, which of the
 * six stages this page belongs to (opening the building guide), and the previous/next stage tool.
 * An optional note explains how the page fits the stage.
 */
const props = withDefaults(defineProps<{ stage: JourneyStage['key'], compact?: boolean, note?: string }>(), { compact: true, note: '' })
const current = computed(() => journeyStage(props.stage))
const prev = computed(() => prevStage(props.stage))
const next = computed(() => nextStage(props.stage))
// Inside the workspace, step to the working pages; elsewhere to the stage pages
const route = useRoute()
const inApp = computed(() => route.meta.ownPanel === true)
const linkFor = (s: JourneyStage) => (inApp.value && s.appTo) || s.to
const goBack = useGoBack('/')
const showNote = ref(false)
</script>

<template>
  <nav v-if="showGuide" class="no-print rounded-lg border border-default bg-default text-sm" aria-label="Construction stage">
    <div class="flex items-center gap-1 px-1.5 py-1.5">
      <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" label="Back" @click="goBack" />
      <span class="h-5 w-px bg-accented mx-1" aria-hidden="true" />
      <NuxtLink :to="`/guide/${current.key}`" class="group flex items-center gap-2 min-w-0 rounded-md px-1.5 py-1 hover:bg-elevated/60" :title="`About stage ${current.no}: ${current.title}`">
        <span class="size-5 shrink-0 rounded-full bg-primary text-inverted grid place-items-center text-[10px] font-bold">{{ current.no }}</span>
        <span class="truncate">
          <span class="text-muted hidden sm:inline">Step {{ current.no }} of {{ JOURNEY.length }} · </span>
          <b class="text-highlighted">{{ current.title }}</b>
        </span>
        <UIcon name="i-lucide-info" class="shrink-0 text-dimmed group-hover:text-primary" />
      </NuxtLink>
      <span class="ms-auto flex items-center shrink-0">
        <UButton v-if="note" size="sm" color="neutral" variant="ghost" :icon="showNote ? 'i-lucide-chevron-up' : 'i-lucide-message-square-text'" :aria-label="showNote ? 'Hide note' : 'Show note'" @click="showNote = !showNote" />
        <UTooltip v-if="prev" :text="`Step ${prev.no}: ${prev.title}`">
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-chevron-left" :to="linkFor(prev)" :aria-label="`Step ${prev.no}: ${prev.title}`" />
        </UTooltip>
        <UTooltip v-if="next" :text="`Step ${next.no}: ${next.title}`">
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-chevron-right" :to="linkFor(next)" :aria-label="`Step ${next.no}: ${next.title}`" />
        </UTooltip>
      </span>
    </div>
    <p v-if="note && showNote" class="border-t border-default px-4 py-2 text-xs text-muted">
      {{ note }}
    </p>
  </nav>
</template>
