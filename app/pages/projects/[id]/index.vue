<script setup lang="ts">
import { PREREQUISITES } from '#shared/calc/bq'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data: project, refresh, error } = await useFetch<ProjectDetail>(() => `/api/projects/${id.value}`)
const { data: config } = await useBqConfig()
const { user } = useUserSession()
const { call, toast } = useApi()
useSeoMeta({ title: () => `${project.value?.name ?? 'BQ'} | Davecore BQ` })

const editable = computed(() => project.value?.status === 'draft')
const { rows: pagedDocs, page: docPage, pageSize: docPageSize, total: docTotal, from: docFrom, to: docTo } = usePaged(() => project.value?.documents ?? [], 'project:revisions')
const journey = computed(() => {
  const s = project.value?.status ?? 'draft'
  const notes: Record<string, string> = {
    draft: 'Measure and price every bill. Use the calculators tab for element quantities, then submit the BQ for review.',
    submitted: 'Waiting for a professional to check quantities and rates. They can approve it or return it to draft with comments.',
    approved: 'Approved. Issue it to lock this revision so contractors can price against it.',
    issued: 'Issued and locked. Print or export it for tendering; any change on site becomes a new revision.'
  }
  return { stage: stageForStatus(s), note: notes[s] ?? '' }
})
const reviewer = computed(() => user.value?.role === 'admin' || user.value?.role === 'professional')
const tab = ref('bills')
const tabs = [
  { label: 'Bills', value: 'bills', icon: 'i-lucide-table' },
  { label: 'Summary', value: 'summary', icon: 'i-lucide-sigma' },
  { label: 'Calculators', value: 'calculators', icon: 'i-lucide-calculator' },
  { label: 'Details & notes', value: 'details', icon: 'i-lucide-file-text' },
  { label: 'Revisions', value: 'revisions', icon: 'i-lucide-history' }
]

// Item & library modals
const itemOpen = ref(false)
const editingItem = ref<BqItem | null>(null)
const targetBill = ref<string | null>(null)
const libraryOpen = ref(false)
function addItem(billId: string) { editingItem.value = null; targetBill.value = billId; itemOpen.value = true }
function editItem(item: BqItem) { editingItem.value = item; targetBill.value = item.billId; itemOpen.value = true }
function openLibrary(billId: string) { targetBill.value = billId; libraryOpen.value = true }
const targetTemplateKey = computed(() => project.value?.bills.find(b => b.id === targetBill.value)?.templateKey)

// Workflow
const transitioning = ref(false)
async function transition(action: 'submit' | 'return' | 'approve' | 'issue' | 'revise') {
  transitioning.value = true
  try {
    const res = await call<{ id: string }>(`/api/projects/${id.value}/transition`, { method: 'POST', body: { action } })
    const messages = { submit: 'Submitted for review', return: 'Returned to draft', approve: 'BQ approved', issue: 'BQ issued and snapshot saved', revise: 'New draft revision created' }
    toast.add({ title: messages[action], color: 'success', icon: 'i-lucide-check' })
    if (res.id !== id.value) await navigateTo(`/projects/${res.id}`)
    else await refresh()
  }
  finally { transitioning.value = false }
}

const actions = computed(() => {
  const p = project.value
  if (!p) return []
  const list: { label: string, icon: string, action: Parameters<typeof transition>[0], color?: 'primary' | 'neutral' | 'success' }[] = []
  if (p.status === 'draft') list.push({ label: 'Submit for review', icon: 'i-lucide-send', action: 'submit' })
  if (p.status === 'submitted' && reviewer.value) list.push({ label: 'Approve', icon: 'i-lucide-check-check', action: 'approve', color: 'success' })
  if ((p.status === 'submitted' || p.status === 'approved') && (reviewer.value || p.ownerId === user.value?.id)) list.push({ label: 'Return to draft', icon: 'i-lucide-undo-2', action: 'return', color: 'neutral' })
  if (p.status === 'approved' && reviewer.value) list.push({ label: 'Issue BQ', icon: 'i-lucide-stamp', action: 'issue' })
  if (p.status === 'issued') list.push({ label: 'Create revision', icon: 'i-lucide-git-branch-plus', action: 'revise' })
  return list
})

// Summary settings
const pricing = reactive({ contingencyPercent: 5, vatPercent: 16 })
watchEffect(() => {
  if (project.value) {
    pricing.contingencyPercent = project.value.contingencyPercent
    pricing.vatPercent = project.value.vatPercent
  }
})
async function savePricing() {
  await call(`/api/projects/${id.value}`, { method: 'PUT', body: pricing })
  await refresh()
}

// Details
const details = reactive({ name: '', client: '', siteAddress: '', preparedBy: '', locationId: undefined as number | undefined, finishKey: '', assumptions: '', exclusions: '' })
watchEffect(() => {
  const p = project.value
  if (p) Object.assign(details, { name: p.name, client: p.client, siteAddress: p.siteAddress, preparedBy: p.preparedBy, locationId: p.locationId ?? undefined, finishKey: p.finishKey ?? 'standard', assumptions: p.assumptions, exclusions: p.exclusions })
})
const savingDetails = ref(false)
async function saveDetails() {
  savingDetails.value = true
  try {
    await call(`/api/projects/${id.value}`, { method: 'PUT', body: details })
    toast.add({ title: 'Details saved', color: 'success', icon: 'i-lucide-check' })
    await refresh()
  }
  finally { savingDetails.value = false }
}

// Regenerate
const regenOpen = ref(false)
async function regenerate() {
  await call(`/api/projects/${id.value}/generate`, { method: 'POST' })
  regenOpen.value = false
  toast.add({ title: 'BQ regenerated from parameters', color: 'success', icon: 'i-lucide-check' })
  await refresh()
}

// Bills
const billOpen = ref(false)
const newBill = reactive({ title: '', provisional: false })
async function addBill() {
  await call(`/api/projects/${id.value}/bills`, { method: 'POST', body: newBill })
  billOpen.value = false
  newBill.title = ''
  await refresh()
}

const deleteOpen = ref(false)
async function deleteProject() {
  await call(`/api/projects/${id.value}`, { method: 'DELETE' })
  await navigateTo('/projects')
}

const nonEmptyBills = computed(() => project.value?.bills.filter(b => b.items.length || editable.value) ?? [])
</script>

<template>
  <UDashboardPanel id="project">
    <template #header>
      <UDashboardNavbar :title="project?.name ?? 'Project'">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/projects" />
        </template>
        <template #trailing>
          <UBadge v-if="project" :color="STATUS_LABELS[project.status]?.color" variant="subtle" :label="`${STATUS_LABELS[project.status]?.label} · Rev ${project.revision}`" />
        </template>
        <template #right>
          <UButton
            v-for="a in actions"
            :key="a.action"
            :icon="a.icon"
            :label="a.label"
            :color="a.color ?? 'primary'"
            :variant="a.color === 'neutral' ? 'outline' : 'solid'"
            :loading="transitioning"
            class="hidden sm:inline-flex"
            @click="transition(a.action)"
          />
          <UDropdownMenu
            :items="[
              [{ label: 'Print / PDF', icon: 'i-lucide-printer', to: `/projects/${id}/print`, target: '_blank' },
               { label: 'Export CSV (Excel)', icon: 'i-lucide-sheet', href: `/api/projects/${id}/export.csv`, external: true }],
              ...(editable ? [[{ label: 'Add a bill', icon: 'i-lucide-folder-plus', onSelect: () => { billOpen = true } },
                               { label: 'Regenerate from parameters', icon: 'i-lucide-refresh-cw', onSelect: () => { regenOpen = true } }]] : []),
              ...(actions.length ? [actions.map(a => ({ label: a.label, icon: a.icon, class: 'sm:hidden', onSelect: () => transition(a.action) }))] : []),
              ...(project?.status !== 'issued' ? [[{ label: 'Delete project', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => { deleteOpen = true } }]] : [])
            ]"
            :content="{ align: 'end' }"
          >
            <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="outline" aria-label="More actions" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" :title="errorMessage(error)" />
      <template v-else-if="project">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted uppercase tracking-wider">
              Grand total (incl. VAT)
            </p>
            <p class="font-display text-xl font-bold tabular-nums text-primary">
              {{ formatMoney(project.summary.grandTotal, project.currency) }}
            </p>
          </UCard>
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted uppercase tracking-wider">
              Measured works
            </p>
            <p class="text-xl font-semibold tabular-nums">
              {{ formatMoney(project.summary.subtotal, project.currency) }}
            </p>
          </UCard>
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted uppercase tracking-wider">
              Location
            </p>
            <p class="text-xl font-semibold truncate">
              {{ project.location?.name ?? '—' }}
            </p>
          </UCard>
          <UCard :ui="{ body: 'p-4 sm:p-4' }">
            <p class="text-xs text-muted uppercase tracking-wider">
              Readiness
            </p>
            <p class="text-xl font-semibold">
              {{ project.readiness.percent }}% <span class="text-sm font-normal text-muted">{{ project.readiness.level }}</span>
            </p>
          </UCard>
        </div>

        <JourneyGuide :stage="journey.stage" compact :note="journey.note" />

        <UAlert v-if="!editable" color="info" variant="subtle" icon="i-lucide-lock" :title="project.status === 'issued' ? 'This revision is issued and locked. Create a revision to make changes.' : 'This BQ is in review and locked. Return it to draft to edit.'" />

        <UTabs v-model="tab" :items="tabs" variant="link" :content="false" class="w-full" />

        <!-- Bills -->
        <div v-if="tab === 'bills'" class="space-y-4">
          <BqBillTable
            v-for="bill in nonEmptyBills"
            :key="bill.id"
            :bill="bill"
            :currency="project.currency"
            :editable="editable"
            :project-id="project.id"
            @changed="refresh"
            @add="addItem"
            @edit="editItem"
            @library="openLibrary"
          />
          <UButton v-if="editable" color="neutral" variant="outline" icon="i-lucide-folder-plus" label="Add a bill" @click="billOpen = true" />
        </div>

        <!-- Summary -->
        <div v-else-if="tab === 'summary'" class="grid lg:grid-cols-3 gap-4">
          <UCard class="lg:col-span-2" :ui="{ body: 'p-0 sm:p-0' }">
            <template #header>
              <h3 class="font-semibold">
                Grand summary
              </h3>
            </template>
            <table class="bq-table">
              <thead>
                <tr>
                  <th class="w-16">
                    Bill
                  </th><th>Description</th><th class="num">
                    Amount ({{ project.currency }})
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in project.summary.billTotals" :key="b.id">
                  <td>{{ b.number }}</td><td>{{ b.title }}</td><td class="num">
                    {{ formatNumber(b.total, 2) }}
                  </td>
                </tr>
                <tr class="font-semibold">
                  <td /><td>Sub-total</td><td class="num">
                    {{ formatNumber(project.summary.subtotal, 2) }}
                  </td>
                </tr>
                <tr>
                  <td /><td>Add: Contingencies ({{ project.contingencyPercent }}%)</td><td class="num">
                    {{ formatNumber(project.summary.contingency, 2) }}
                  </td>
                </tr>
                <tr class="font-semibold">
                  <td /><td>Total before VAT</td><td class="num">
                    {{ formatNumber(project.summary.beforeVat, 2) }}
                  </td>
                </tr>
                <tr>
                  <td /><td>Add: VAT ({{ project.vatPercent }}%)</td><td class="num">
                    {{ formatNumber(project.summary.vat, 2) }}
                  </td>
                </tr>
                <tr class="font-bold text-highlighted text-base">
                  <td /><td>GRAND TOTAL CARRIED TO FORM OF TENDER</td><td class="num">
                    {{ formatNumber(project.summary.grandTotal, 2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </UCard>
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Pricing
              </h3>
            </template>
            <div class="space-y-4">
              <UFormField label="Contingency (%)">
                <UInput v-model.number="pricing.contingencyPercent" type="number" min="0" max="50" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="VAT (%)">
                <UInput v-model.number="pricing.vatPercent" type="number" min="0" max="50" :disabled="!editable" class="w-full" />
              </UFormField>
              <UButton v-if="editable" block label="Update totals" @click="savePricing" />
            </div>
          </UCard>
        </div>

        <!-- Calculators -->
        <div v-else-if="tab === 'calculators'">
          <UAlert v-if="!editable" color="info" variant="subtle" title="Calculators can add items only while the BQ is a draft." class="mb-4" />
          <MaterialCalculator :project-id="editable ? project.id : undefined" :project-location-id="project.locationId" @added="refresh" />
        </div>

        <!-- Details -->
        <div v-else-if="tab === 'details'" class="grid lg:grid-cols-3 gap-4">
          <UCard class="lg:col-span-2">
            <form class="grid sm:grid-cols-2 gap-4" @submit.prevent="saveDetails">
              <UFormField label="Project name" class="sm:col-span-2">
                <UInput v-model="details.name" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Client">
                <UInput v-model="details.client" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Prepared by">
                <UInput v-model="details.preparedBy" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Site address" class="sm:col-span-2">
                <UInput v-model="details.siteAddress" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Rate location" help="Changing location or finish affects newly added items and regenerations.">
                <USelect v-model="details.locationId" :items="locationSelectItems(config)" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Finish level">
                <USelect v-model="details.finishKey" :items="(config?.finishes ?? []).map(f => ({ label: f.label, value: f.key }))" :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Assumptions" class="sm:col-span-2">
                <UTextarea v-model="details.assumptions" :rows="6" autoresize :disabled="!editable" class="w-full" />
              </UFormField>
              <UFormField label="Exclusions" class="sm:col-span-2">
                <UTextarea v-model="details.exclusions" :rows="4" autoresize :disabled="!editable" class="w-full" />
              </UFormField>
              <div v-if="editable" class="sm:col-span-2">
                <UButton type="submit" :loading="savingDetails" label="Save details" />
              </div>
            </form>
          </UCard>
          <UCard>
            <template #header>
              <h3 class="font-semibold">
                Prerequisites
              </h3>
            </template>
            <ul class="space-y-2 text-sm">
              <li v-for="p in PREREQUISITES" :key="p.key" class="flex items-center justify-between gap-2">
                <span>{{ p.label }}</span>
                <UBadge
                  size="sm"
                  variant="subtle"
                  :color="project.prerequisites[p.key] === 'have' ? 'success' : project.prerequisites[p.key] === 'partial' ? 'warning' : 'error'"
                  :label="project.prerequisites[p.key] === 'have' ? 'Have' : project.prerequisites[p.key] === 'partial' ? 'Partly' : 'Missing'"
                />
              </li>
            </ul>
            <USeparator class="my-4" />
            <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Building parameters
            </p>
            <ul class="text-sm space-y-1 text-muted">
              <li>Floors: {{ (project.params.floorAreas ?? []).join(' + ') }} m²</li>
              <li>Wall height: {{ project.params.wallHeight }} m · Doors {{ project.params.doors }} · Windows {{ project.params.windows }}</li>
            </ul>
          </UCard>
        </div>

        <!-- Revisions -->
        <div v-else-if="tab === 'revisions'">
          <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <table class="bq-table">
              <thead>
                <tr>
                  <th>Revision</th><th>Issued</th><th class="num">
                    Grand total
                  </th><th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in pagedDocs" :key="d.id">
                  <td>Rev {{ d.revision }}</td>
                  <td>{{ new Date(d.issuedAt).toLocaleString('en-KE') }}</td>
                  <td class="num">
                    {{ formatMoney(d.grandTotal, project.currency, 2) }}
                  </td>
                  <td class="text-right">
                    <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-printer" label="View" :to="`/projects/${d.projectId}/print?doc=${d.id}`" target="_blank" />
                  </td>
                </tr>
                <tr v-if="!project.documents.length">
                  <td colspan="4" class="text-center text-muted py-6">
                    No revision has been issued yet. Issued BQs are stored as permanent snapshots.
                  </td>
                </tr>
              </tbody>
            </table>
            <TablePager v-model:page="docPage" v-model:page-size="docPageSize" :total="docTotal" :from="docFrom" :to="docTo" noun="revisions" />
          </UCard>
        </div>

        <BqItemModal v-model:open="itemOpen" :project-id="project.id" :bills="project.bills" :item="editingItem" :bill-id="targetBill" @saved="refresh" />
        <BqLibraryModal v-model:open="libraryOpen" :project-id="project.id" :bill-id="targetBill" :bill-template-key="targetTemplateKey" @saved="refresh" />

        <UModal v-model:open="billOpen" title="Add a bill">
          <template #body>
            <div class="space-y-4">
              <UFormField label="Bill title">
                <UInput v-model="newBill.title" placeholder="e.g. Septic Tank & Soak Pit" class="w-full" />
              </UFormField>
              <USwitch v-model="newBill.provisional" label="Mark as provisional" />
            </div>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" label="Cancel" @click="billOpen = false" />
              <UButton :disabled="!newBill.title.trim()" label="Add bill" @click="addBill" />
            </div>
          </template>
        </UModal>

        <UModal v-model:open="regenOpen" title="Regenerate the BQ?" description="All bills and items will be replaced by a fresh draft from the project parameters and current library rates. Manual edits will be lost.">
          <template #footer>
            <div class="flex justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" label="Cancel" @click="regenOpen = false" />
              <UButton color="warning" icon="i-lucide-refresh-cw" label="Replace with fresh draft" @click="regenerate" />
            </div>
          </template>
        </UModal>

        <UModal v-model:open="deleteOpen" title="Delete this project?" description="This permanently removes the project, its bills and items.">
          <template #footer>
            <div class="flex justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" label="Cancel" @click="deleteOpen = false" />
              <UButton color="error" icon="i-lucide-trash-2" label="Delete project" @click="deleteProject" />
            </div>
          </template>
        </UModal>
      </template>
    </template>
  </UDashboardPanel>
</template>
