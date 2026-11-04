import { useState, type FormEvent } from "react";
import { changePassword } from "../api/auth";

interface ChangePasswordFormProps {
  onPasswordChanged: () => void;
}

export default function ChangePasswordForm({
  onPasswordChanged,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onPasswordChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Det gick inte att ändra lösenordet.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="current-password" className="form-label">
          Nuvarande lösenord
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          className="form-control"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="new-password" className="form-label">
          Nytt lösenord
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          className="form-control"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          maxLength={72}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="confirm-password" className="form-label">
          Bekräfta nytt lösenord
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          className="form-control"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-danger" disabled={saving}>
        {saving ? "Ändrar lösenord..." : "Ändra lösenord"}
      </button>
    </form>
  );
}
