import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sv } from '../src/i18n/sv.ts'
import { en } from '../src/i18n/en.ts'
import { readLocale, saveLocale } from '../src/utils/locale.ts'
import { readTheme, saveTheme } from '../src/utils/theme.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

test('language and theme preferences restore saved values and safely default invalid values', () => {
  const stored = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  } })
  assert.equal(readLocale(), 'sv')
  assert.equal(readTheme(), 'dark')
  saveLocale('en')
  saveTheme('light')
  assert.equal(stored.get('fv-locale'), 'en')
  assert.equal(stored.get('fv-theme'), 'light')
  assert.equal(readLocale(), 'en')
  assert.equal(readTheme(), 'light')
  stored.set('fv-locale', 'EN')
  stored.set('fv-theme', 'system')
  assert.equal(readLocale(), 'sv')
  assert.equal(readTheme(), 'dark')
})

test('unavailable or blocked storage does not break preference switching', () => {
  for (const blocked of [false, true]) {
    Reflect.deleteProperty(globalThis, 'localStorage')
    if (blocked) Object.defineProperty(globalThis, 'localStorage', { configurable: true,
      get: () => { throw new Error('Storage blocked') },
    })
    assert.equal(readLocale(), 'sv')
    assert.equal(readTheme(), 'dark')
    assert.doesNotThrow(() => { saveLocale('en'); saveTheme('light') })
  }
})

test('startup applies language and theme before styles load, with storage failure defaults', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1]
  for (const blocked of [false, true]) {
    const attributes: Record<string, string> = {}
    const root = { lang: '', style: { colorScheme: '' }, setAttribute: (key: string, value: string) => { attributes[key] = value } }
    runInNewContext(script, { document: { documentElement: root }, localStorage: { getItem: (key: string) => {
      if (blocked) throw new Error('Storage blocked')
      return key === 'fv-locale' ? 'en' : 'light'
    } } })
    assert.equal(root.lang, blocked ? 'sv' : 'en')
    assert.equal(attributes['data-theme'], blocked ? 'dark' : 'light')
    assert.equal(attributes['data-bs-theme'], root.style.colorScheme)
  }
  assert.ok(html.indexOf('<script>') < html.indexOf('rel="stylesheet"'))
})

test('Swedish and English dictionaries have the same keys and interpolation parameters', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(sv).sort())
  const parameters = (value: string) => [...new Set([...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort()
  for (const key of Object.keys(sv) as (keyof typeof sv)[]) {
    assert.ok(sv[key].trim() && en[key].trim(), key)
    assert.deepEqual(parameters(en[key]), parameters(sv[key]), key)
  }
})
