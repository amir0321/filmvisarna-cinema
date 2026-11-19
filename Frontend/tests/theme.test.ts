import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileString, Logger } from 'sass'

const css = compileString("@import 'tokens';", {
  loadPaths: [new URL('../src/styles', import.meta.url).pathname], logger: Logger.silent,
}).css

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
    // Dashboard eyebrow: 12% red badge above either end of the hero gradient.
    const mix = (ink: number[], surface: number[], alpha: number) =>
      ink.map((channel, index) => channel * alpha + surface[index] * (1 - alpha))
    for (const heroSurface of [
      mix(tokens['color-primary'], tokens['color-surface'], 0.07),
      mix(tokens['surface-overlay'], tokens['color-surface'], 0.02),
    ]) {
      const eyebrowSurface = mix(tokens['color-primary'], heroSurface, 0.12)
      assert.ok(contrast(tokens['color-danger-soft'], eyebrowSurface) >= 4.5, 'dashboard eyebrow')
      for (const text of ['text-heading', 'text-secondary']) {
        assert.ok(contrast(tokens[text], heroSurface) >= 4.5, `dashboard hero ${text}`)
      }
    }
  })
}
