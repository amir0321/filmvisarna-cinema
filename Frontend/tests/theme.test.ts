import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { compileString, Logger } from 'sass'
import { isTheme } from '../src/utils/theme.ts'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const startupScript = html.match(/<script>([\s\S]*?)<\/script>/)![1]

for (const stored of [null, 'dark', 'light', 'invalid', 'LIGHT', ' light ', '"light"', 'system', '']) {
  test(`theme is applied before app startup with stored value ${stored}`, () => {
    const attributes: Record<string, string> = {}
    const root = {
      style: { colorScheme: '' },
      setAttribute: (name: string, value: string) => { attributes[name] = value },
    }
    runInNewContext(startupScript, {
      localStorage: { getItem: (key: string) => { assert.equal(key, 'fv-theme'); return stored } },
      document: { documentElement: root },
    })
    const expected = isTheme(stored) ? stored : 'dark'
    assert.equal(attributes['data-theme'], expected)
    assert.equal(attributes['data-bs-theme'], expected)
    assert.equal(root.style.colorScheme, expected)
    assert.ok(html.indexOf('<script>') < html.indexOf('rel="stylesheet"'))
  })
}

test('blocked storage leaves a usable dark theme', () => {
  const attributes: Record<string, string> = {}
  const root = {
    style: { colorScheme: '' },
    setAttribute: (name: string, value: string) => { attributes[name] = value },
  }
  runInNewContext(startupScript, {
    localStorage: { getItem: () => { throw new Error('Storage blocked') } },
    document: { documentElement: root },
  })
  assert.equal(attributes['data-theme'], 'dark')
  assert.equal(attributes['data-bs-theme'], 'dark')
  assert.equal(root.style.colorScheme, 'dark')
})

const css = compileString(`
  @import 'tokens';
  .theme-probe {
    background: $fv-nav-bg;
    color: tint($fv-fg, 0.8);
    border-color: $white-overlay-15;
    box-shadow: 0 0 4px tint($fv-primary, 0.3);
  }
`, { loadPaths: [new URL('../src/styles', import.meta.url).pathname], logger: Logger.silent }).css

test('Sass alpha colors retain the browser theme channels', () => {
  const probe = css.match(/\.theme-probe \{([^}]+)\}/)![1]
  assert.match(probe, /rgba\(var\(--color-bg-rgb\), 0\.9\)/)
  assert.match(probe, /rgba\(var\(--text-primary-rgb\), 0\.8\)/)
  assert.match(probe, /rgba\(var\(--surface-overlay-rgb\), 0\.15\)/)
  assert.match(probe, /rgba\(var\(--color-primary-rgb\), 0\.3\)/)
})

function luminance(rgb: number[]): number {
  return rgb.map(value => value / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
}

function contrast(a: number[], b: number[]): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

for (const theme of ['dark', 'light']) {
  test(`${theme} palette meets AA for text on base surfaces and primary actions`, () => {
    const rule = css.match(new RegExp(`\\[data-theme=${theme}\\] \\{([^}]+)\\}`))![1]
    const tokens: Record<string, number[]> = Object.fromEntries(
      [...rule.matchAll(/--([\w-]+)-rgb: ([\d, ]+);/g)]
        .map(match => [match[1], match[2].split(',').map(Number)]),
    )
    for (const text of ['text-primary', 'text-heading', 'text-secondary', 'text-muted',
      'color-success', 'color-warning', 'color-danger-soft', 'color-info']) {
      for (const surface of ['color-bg', 'color-surface', 'color-surface-2', 'color-surface-muted']) {
        assert.ok(contrast(tokens[text], tokens[surface]) >= 4.5, `${text} on ${surface}`)
      }
    }
    assert.ok(contrast(tokens['color-white'], tokens['color-primary']) >= 4.5)
    assert.ok(contrast(tokens['text-on-success'], tokens['seat-selected-bg']) >= 4.5)
    assert.ok(contrast(tokens['text-on-danger'], tokens['color-danger']) >= 4.5)
    // Worst case: a white image pixel beneath the mobile hero gradient's lightest stop.
    const captionPlate = tokens['image-scrim'].map(channel => channel * 0.7 + 255 * 0.3)
    assert.ok(contrast(tokens['image-text'], captionPlate) >= 4.5)
    assert.ok(contrast(tokens['image-text-muted'], captionPlate) >= 4.5)
  })
}
