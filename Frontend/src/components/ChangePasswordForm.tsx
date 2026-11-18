import { translateApiError } from '../i18n/mappers'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import { useState, type FormEvent } from 'react'
import { changePassword, login } from '../api/auth'
import PasswordField from './auth/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { useInlineFeedback } from '../hooks/useInlineFeedback'



export default function ChangePasswordForm() {
  const { t, locale } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user, setSession } = useAuth()
  const [saved, showSaved] = useInlineFeedback(5000)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(sv['auth.passwordsMismatch']);
      return;
    }

    if (newPassword.length < 8) {
      setError(sv['auth.newPasswordShort']);
      return;
    }

    setSaving(true);

   try {
  if (!user) {
    throw new Error(sv['auth.loginRequiredForPassword'])
  }

  await changePassword({ currentPassword, newPassword })

  const response = await login({
    email: user.email,
    password: newPassword,
  })

  setSession(response)

  setCurrentPassword('')
  setNewPassword('')
  setConfirmPassword('')
  showSaved()
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : sv['auth.updateLoginError'],
  )
} finally {
  setSaving(false)
    }
 }

  return (
    <form onSubmit={handleSubmit}>
<div className="d-grid gap-3 mb-4">
  <PasswordField
    id="current-password"
    label={t('auth.currentPassword')}
    value={currentPassword}
    onChange={setCurrentPassword}
  />

  <PasswordField
    id="new-password"
    label={t('auth.newPassword')}
    value={newPassword}
    onChange={setNewPassword}
    registering
    showStrength
  />

  <PasswordField
    id="confirm-password"
    label={t('auth.confirmPassword')}
    value={confirmPassword}
    onChange={setConfirmPassword}
    registering
    showStrength={false}
  />
</div>

      {error && (
        <p role="alert" className="text-danger">
          {translateApiError(error, locale)}
        </p>
      )}

      {saved && (
  <p role="status" className="text-success">
    {t('auth.passwordChanged')}
  </p>
)}
      <button type="submit" className="btn btn-danger" disabled={saving}>
        {saving ? t('auth.changingPassword') : t('auth.changePassword')}
      </button>
    </form>
  );
}
