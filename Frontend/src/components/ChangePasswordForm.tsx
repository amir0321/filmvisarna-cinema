import { useState, type FormEvent } from 'react'
import { changePassword, login } from '../api/auth'
import PasswordField from './auth/PasswordField'
import { useAuth } from '../hooks/useAuth'
import { useInlineFeedback } from '../hooks/useInlineFeedback'



export default function ChangePasswordForm() {
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
      setError("De nya lösenorden matchar inte.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Det nya lösenordet måste innehålla minst 8 tecken.");
      return;
    }

    setSaving(true);

   try {
  if (!user) {
    throw new Error('Du måste vara inloggad för att ändra lösenordet.')
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
      : 'Det gick inte att uppdatera inloggningen.',
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
    label="Nuvarande lösenord"
    value={currentPassword}
    onChange={setCurrentPassword}
  />

  <PasswordField
    id="new-password"
    label="Nytt lösenord"
    value={newPassword}
    onChange={setNewPassword}
    registering
    showStrength
  />

  <PasswordField
    id="confirm-password"
    label="Bekräfta nytt lösenord"
    value={confirmPassword}
    onChange={setConfirmPassword}
    registering
    showStrength={false}
  />
</div>

      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      {saved && (
  <p role="status" className="text-success">
    Lösenordet har ändrats!
  </p>
)}
      <button type="submit" className="btn btn-danger" disabled={saving}>
        {saving ? "Ändrar lösenord..." : "Ändra lösenord"}
      </button>
    </form>
  );
}
