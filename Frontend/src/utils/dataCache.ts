// Only public catalogue data uses this cache. Account and booking data remain request scoped.
interface Entry {
  data?: unknown
  updatedAt: number
  generation: number
  promise?: Promise<unknown>
  listeners: Set<(invalidated: boolean) => void>
}
const entries = new Map<string, Entry>()
function entry(key: string): Entry {
  let value = entries.get(key)
  if (!value) {
    // Bound searches / filter combinations without evicting active subscribers or requests.
    if (entries.size >= 100) {
      const oldest = [...entries].find(([, item]) => !item.listeners.size && !item.promise)
      if (oldest) entries.delete(oldest[0])
    }
    value = { updatedAt: 0, generation: 0, listeners: new Set() }
    entries.set(key, value)
  }
  return value
}
export function readCache<T>(key: string): T | undefined {
  return entries.get(key)?.data as T | undefined
}
export function subscribeCache(key: string, listener: (invalidated: boolean) => void) {
  const item = entry(key)
  item.listeners.add(listener)
  return () => { item.listeners.delete(listener) }
}
export function fetchCached<T>(key: string, fetcher: () => Promise<T>, staleTime: number, force = false): Promise<T> {
  const item = entry(key)
  if (item.promise) return item.promise as Promise<T>
  if (!force && item.data !== undefined && Date.now() - item.updatedAt < staleTime) {
    return Promise.resolve(item.data as T)
  }
  const generation = item.generation
  const promise = Promise.resolve().then(fetcher).then(result => {
    if (item.generation === generation) {
      item.data = result
      item.updatedAt = Date.now()
      item.listeners.forEach(listener => listener(false))
    }
    return result
  }).finally(() => {
    if (item.promise === promise) item.promise = undefined
  })
  item.promise = promise
  return promise
}
export function writeCache<T>(key: string, value: T) {
  const item = entry(key)
  item.generation += 1
  item.promise = undefined
  item.data = value
  item.updatedAt = Date.now()
  item.listeners.forEach(listener => listener(false))
}
export function invalidatePublicData() {
  for (const item of entries.values()) {
    item.generation += 1
    item.updatedAt = 0
    item.promise = undefined
    item.listeners.forEach(listener => listener(true))
  }
}
