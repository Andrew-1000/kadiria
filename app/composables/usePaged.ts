import type { MaybeRefOrGetter } from 'vue'

export const PAGE_SIZES = [10, 25, 50, 100]

/**
 * In-memory (client-side) pagination over an already-loaded list.
 * The page and page size are kept in app state per `key`, so a table remembers its position
 * when you navigate away and come back during the session.
 */
export function usePaged<T>(source: MaybeRefOrGetter<T[]>, key: string, defaultSize = 10) {
  const state = useState(`paged:${key}`, () => ({ page: 1, pageSize: defaultSize }))
  const all = computed(() => toValue(source) ?? [])
  const total = computed(() => all.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / state.value.pageSize)))

  const page = computed({
    get: () => Math.min(state.value.page, pageCount.value),
    set: (p: number) => { state.value = { ...state.value, page: Math.max(1, Math.min(p, pageCount.value)) } }
  })
  const pageSize = computed({
    get: () => state.value.pageSize,
    set: (size: number) => {
      // keep the first visible row on screen when changing page size
      const firstRow = (page.value - 1) * state.value.pageSize
      state.value = { pageSize: size, page: Math.floor(firstRow / size) + 1 }
    }
  })

  const rows = computed(() => all.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
  const from = computed(() => total.value ? (page.value - 1) * pageSize.value + 1 : 0)
  const to = computed(() => Math.min(page.value * pageSize.value, total.value))

  return { rows, page, pageSize, total, pageCount, from, to }
}
