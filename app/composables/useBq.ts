import type { InputDef } from '#shared/calc/types'

export interface PublicConfig {
  flags: Record<string, boolean>
  countries: { code: string, name: string, currency: string, vatPercent: number }[]
  tiers: { id: number, countryCode: string, key: string, label: string, sort: number }[]
  locations: { id: number, tierId: number, name: string, adjustmentPercent: number, sort: number }[]
  finishes: { key: string, label: string, description: string, labourPercent: number, sort: number }[]
  rates: { tierId: number, finishKey: string, minRate: number, maxRate: number, effectiveFrom: string }[]
  buildingTypes: { key: string, label: string, description: string, factor: number, defaultFloors: number, minFloors: number, maxFloors: number }[]
  addons: { key: string, label: string, description: string, percent: number, enabledByDefault: boolean, sort: number }[]
  elements: { key: string, label: string, percent: number, sort: number }[]
  mixes: { key: string, name: string, kind: 'concrete' | 'mortar', cement: number, sand: number, ballast: number }[]
  constants: Record<string, number>
  modules: { key: string, name: string, short: string, description: string, billKey: string, icon: string, formula: string[], stage: string, onSite: string, sequence: number, inputs: InputDef[], enabled: boolean, sort: number }[]
  /** Construction methods (masonry, ISSB, timber frame, LGS / prefab, 3D-printed) with their cost factor. */
  methods?: { key: string, label: string, description: string, factor: number, maxFloors: number, source: string }[]
}

/** Shared, cached public configuration (rates, locations, modules...). */
export function useBqConfig() {
  return useFetch<PublicConfig>('/api/public/config', { key: 'bq-config', dedupe: 'defer' })
}

/** Extract a readable message from a $fetch error. */
export function errorMessage(e: unknown): string {
  const err = e as { data?: { statusMessage?: string, message?: string }, statusMessage?: string, message?: string }
  return err?.data?.statusMessage || err?.data?.message || err?.statusMessage || err?.message || 'Something went wrong.'
}

/** $fetch wrapper that shows an error toast and rethrows. */
export function useApi() {
  const toast = useToast()
  async function call<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      return await $fetch<T>(url, opts as never) as T
    }
    catch (e) {
      toast.add({ title: errorMessage(e), color: 'error', icon: 'i-lucide-circle-alert' })
      throw e
    }
  }
  return { call, toast }
}

export function groupLocations(config: PublicConfig | null | undefined) {
  if (!config) return []
  return config.tiers.map(tier => ({ tier, locations: config.locations.filter(l => l.tierId === tier.id) }))
}

/**
 * Location options grouped under tier labels for USelect. Typed as plain numeric options so the
 * select's model infers `number` (the label rows carry `type: 'label'` and are not selectable).
 */
export function locationSelectItems(config: PublicConfig | null | undefined): { label: string, value: number }[] {
  const items: { label: string, value?: number, type?: 'label' }[] = []
  for (const g of groupLocations(config)) {
    items.push({ type: 'label', label: g.tier.label })
    for (const l of g.locations) items.push({ label: l.name, value: l.id })
  }
  return items as { label: string, value: number }[]
}
