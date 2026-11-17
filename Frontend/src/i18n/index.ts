import { sv } from './sv.ts'
import { en } from './en.ts'
import type { Locale } from '../utils/locale.ts'

export type TranslationKey = keyof typeof sv

type Placeholders<Text extends string> = 0 extends 1 & Text
  ? never
  : Text extends `${string}{${infer Name}}${infer Rest}`
    ? Name | Placeholders<Rest> : never

export type SimpleTranslationKey = {
  [Key in TranslationKey]: [Placeholders<typeof sv[Key]>] extends [never] ? Key : never
}[TranslationKey]

type MatchingPlaceholders<Dictionary extends Record<TranslationKey, string>> = {
  [Key in TranslationKey]: [Placeholders<Dictionary[Key]>] extends [Placeholders<typeof sv[Key]>]
    ? [Placeholders<typeof sv[Key]>] extends [Placeholders<Dictionary[Key]>] ? string : never
    : never
}

// Check keys and placeholder names in both languages at compile time.
en satisfies MatchingPlaceholders<typeof en>

export type TranslationArgs<Key extends TranslationKey> = [Placeholders<typeof sv[Key]>] extends [never]
  ? [] : [params: Record<Placeholders<typeof sv[Key]>, string | number>]

export type Translator = <Key extends TranslationKey>(key: Key, ...args: TranslationArgs<Key>) => string

export const dictionaries = { sv, en } satisfies Record<Locale, typeof sv | typeof en>

export function translate<Key extends TranslationKey>(locale: Locale, key: Key, ...args: TranslationArgs<Key>): string {
  const template = dictionaries[locale][key]
  const params = args[0] as Record<string, string | number> | undefined
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    params && Object.hasOwn(params, name) ? String(params[name]) : placeholder)
}

export function createTranslator(locale: Locale): Translator {
  return (key, ...args) => translate(locale, key, ...args)
}

// Client feedback is kept as source text in state, then translated on render.
// This also lets a language change update feedback from an earlier request.
const storedMessageKeys = new Map<string, TranslationKey>()
for (const key of Object.keys(sv) as TranslationKey[]) {
  if (!sv[key].includes('{')) {
    storedMessageKeys.set(sv[key], key)
    storedMessageKeys.set(en[key], key)
  }
}

export function translateStoredMessage(message: string, locale: Locale): string {
  const key = storedMessageKeys.get(message)
  return key ? dictionaries[locale][key] : message
}
