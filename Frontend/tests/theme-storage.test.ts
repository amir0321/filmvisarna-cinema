import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { isTheme, readTheme, saveTheme, THEME_STORAGE_KEY } from '../src/utils/theme.ts'

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
let stored: Map<string, string>

beforeEach(() => {
  stored = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => { stored.set(key, value) },
    },
  })
})

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

test('theme validation accepts only the two exact theme names', () => {
  assert.equal(isTheme('dark'), true)
  assert.equal(isTheme('light'), true)
  for (const invalid of [undefined, null, '', 'system', 'Dark', 'LIGHT', ' light ', '"light"', 0, {}, []]) {
    assert.equal(isTheme(invalid), false)
  }
})

test('missing and invalid preferences fall back to dark without changing other storage', () => {
  stored.set('unrelated', 'keep')
  assert.equal(readTheme(), 'dark')
  for (const invalid of ['', 'system', 'LIGHT', ' light ', '"light"', 'null']) {
    stored.set(THEME_STORAGE_KEY, invalid)
    assert.equal(readTheme(), 'dark')
    assert.equal(stored.get(THEME_STORAGE_KEY), invalid)
  }
  assert.equal(stored.get('unrelated'), 'keep')
})

test('saving each theme persists its exact value under fv-theme and restores it', () => {
  stored.set('unrelated', 'keep')
  for (const theme of ['light', 'dark'] as const) {
    saveTheme(theme)
    assert.equal(stored.get('fv-theme'), theme)
    assert.equal(readTheme(), theme)
  }
  assert.equal(stored.get('unrelated'), 'keep')
  assert.equal(stored.size, 2)
})

test('blocked access to localStorage does not prevent using the default theme', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => { throw new Error('Storage access blocked') },
  })
  assert.equal(readTheme(), 'dark')
  assert.doesNotThrow(() => saveTheme('light'))
})

test('read and write failures are handled without throwing', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => { throw new Error('Read blocked') },
      setItem: () => { throw new Error('Quota exceeded') },
    },
  })
  assert.equal(readTheme(), 'dark')
  assert.doesNotThrow(() => saveTheme('light'))
})

test('a full store still restores an existing theme after a failed save', () => {
  stored.set(THEME_STORAGE_KEY, 'dark')
  localStorage.setItem = () => { throw new Error('Quota exceeded') }
  assert.doesNotThrow(() => saveTheme('light'))
  assert.equal(readTheme(), 'dark')
})

test('unavailable localStorage is safe outside a browser', () => {
  Reflect.deleteProperty(globalThis, 'localStorage')
  assert.equal(readTheme(), 'dark')
  assert.doesNotThrow(() => saveTheme('light'))
})
