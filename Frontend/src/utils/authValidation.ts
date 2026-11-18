import { translate } from '../i18n/index.ts'
import { readLocale, type Locale } from './locale.ts'
import type { AuthFieldErrors, RegisterPayload } from '../api/auth'

export function validateEmail(value: string, locale: Locale = readLocale()): string | undefined {
  const email = value.trim()
  if (email.length > 200) return translate(locale, 'validation.emailLong')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return translate(locale, 'validation.emailInvalid')
}

export function validateNewPassword(password: string, locale: Locale = readLocale()): string | undefined {
  if (password.length < 8) return translate(locale, 'validation.passwordShort')
  if (password.length > 72) return translate(locale, 'validation.passwordLong')
  if (new TextEncoder().encode(password).length > 72) return translate(locale, 'validation.passwordBytes')
}

export function validateAuth(values: RegisterPayload, registering: boolean, locale: Locale = readLocale()): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const emailError = validateEmail(values.email, locale)
  if (emailError) errors.email = emailError
  const passwordError = registering ? validateNewPassword(values.password, locale)
    : !values.password ? translate(locale, 'validation.passwordRequired')
      : values.password.length > 72 ? translate(locale, 'validation.passwordLong') : undefined
  if (passwordError) errors.password = passwordError
  if (registering) {
    for (const field of ['firstName', 'lastName'] as const) {
      if (!values[field].trim()) errors[field] = translate(locale, field === 'firstName' ? 'validation.firstNameRequired' : 'validation.lastNameRequired')
      else if (values[field].trim().length > 100) errors[field] = translate(locale, field === 'firstName' ? 'validation.firstNameLong' : 'validation.lastNameLong')
    }
  }
  return errors
}
