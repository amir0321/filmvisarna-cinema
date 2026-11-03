import type { AuthFieldErrors, RegisterPayload } from '../api/auth'

export function validateEmail(value: string): string | undefined {
  const email = value.trim()
  if (email.length > 200) return 'E-postadressen får vara högst 200 tecken.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ange en giltig e-postadress.'
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < 8) return 'Lösenordet måste vara minst 8 tecken.'
  if (password.length > 72) return 'Lösenordet får vara högst 72 tecken.'
  if (new TextEncoder().encode(password).length > 72) return 'Lösenordet är för långt. Å, ä, ö och andra specialtecken kan ta mer plats. Använd högst 72 byte.'
}

export function validateAuth(values: RegisterPayload, registering: boolean): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const emailError = validateEmail(values.email)
  if (emailError) errors.email = emailError
  const passwordError = registering ? validateNewPassword(values.password)
    : !values.password ? 'Ange ditt lösenord.'
      : values.password.length > 72 ? 'Lösenordet får vara högst 72 tecken.' : undefined
  if (passwordError) errors.password = passwordError
  if (registering) {
    for (const field of ['firstName', 'lastName'] as const) {
      const label = field === 'firstName' ? 'förnamn' : 'efternamn'
      if (!values[field].trim()) errors[field] = `Ange ditt ${label}.`
      else if (values[field].trim().length > 100) errors[field] = `${field === 'firstName' ? 'Förnamnet' : 'Efternamnet'} får vara högst 100 tecken.`
    }
  }
  return errors
}
