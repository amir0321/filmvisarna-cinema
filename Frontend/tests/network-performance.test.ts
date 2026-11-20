import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchCached, readCache, invalidatePublicData, subscribeCache } from '../src/utils/dataCache.ts'
import { shouldPlayBackgroundVideo } from '../src/utils/network.ts'
import { synopsisParagraphs } from '../src/utils/synopsis.ts'

test('public cache deduplicates concurrent requests, reuses fresh data and revalidates stale data', async () => {
  let calls = 0
  let resolve!: (value: number[]) => void
  const load = () => { calls++; return new Promise<number[]>(done => { resolve = done }) }
  const first = fetchCached('dedup', load, 1000)
  const second = fetchCached('dedup', load, 1000)
  assert.equal(first, second)
  await Promise.resolve()
  assert.equal(calls, 1)
  resolve([1])
  await first
  assert.deepEqual(await fetchCached('dedup', load, 1000), [1])
  const stale = fetchCached('dedup', async () => [2], 0)
  assert.deepEqual(readCache('dedup'), [1], 'Stale data stays available during revalidation')
  assert.deepEqual(await stale, [2])
})

test('invalidation prevents late responses from overwriting newer data and notifies subscribers', async () => {
  let resolve!: (value: number) => void
  let invalidations = 0
  const unsubscribe = subscribeCache('race', invalidated => { if (invalidated) invalidations++ })
  const old = fetchCached('race', () => new Promise<number>(done => { resolve = done }), 1000)
  await Promise.resolve()
  invalidatePublicData()
  assert.equal(invalidations, 1)
  assert.equal(await fetchCached('race', async () => 2, 1000), 2)
  resolve(1)
  await old
  assert.equal(readCache('race'), 2)
  unsubscribe()
})

test('failed requests can retry without caching errors or erasing stale data', async () => {
  await fetchCached('retry', async () => 1, 1000)
  await assert.rejects(fetchCached('retry', async () => { throw new Error('offline') }, 0))
  assert.equal(readCache('retry'), 1)
  assert.equal(await fetchCached('retry', async () => 3, 0), 3)
})

test('background trailers respect saveData, slow networks and normal 4G', () => {
  for (const effectiveType of ['slow-2g','2g','3g']) assert.equal(shouldPlayBackgroundVideo({ effectiveType }), false)
  assert.equal(shouldPlayBackgroundVideo({ effectiveType: '4g', saveData: true }), false)
  assert.equal(shouldPlayBackgroundVideo({ effectiveType: '4g' }), true)
  assert.equal(shouldPlayBackgroundVideo(), true)
})

test('synopsis paragraphs retain spacing and render API HTML as inert text', () => {
  assert.deepEqual(synopsisParagraphs('<p>First <em>paragraph</em>.</p><p>Second<br>line.</p>'), ['First paragraph.', 'Second\nline.'])
  assert.deepEqual(synopsisParagraphs('Plain text\n\nNext paragraph'), ['Plain text','Next paragraph'])
  assert.deepEqual(synopsisParagraphs('<p>Hello<img src=x onerror=alert(1)></p>'), ['Hello'])
})
