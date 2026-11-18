import { translateApiError } from '../i18n/mappers'
import { useTranslation } from '../context/LocaleContext'
import { sv } from '../i18n/sv'
import { useState, type FormEvent } from "react";
import { updateProfile } from "../api/auth";
import type { User } from "../types/user";
import { useInlineFeedback } from '../hooks/useInlineFeedback'

interface ProfileFormProps {
  user: User;
  onSaved: () => Promise<void>;
}

export default function ProfileForm({ user, onSaved }: ProfileFormProps) {
  const { t, locale } = useTranslation()
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, showSaved] = useInlineFeedback(5000)
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
     await updateProfile({
  firstName: firstName.trim(),
  lastName: lastName.trim(),
  phone: phone.trim() || null,
});

await onSaved();
showSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : sv['profile.saveError'],
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="profile-first-name" className="form-label">
          {t('form.firstName')}
        </label>
        <input
          id="profile-first-name"
          className="form-control"
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="profile-last-name" className="form-label">
          {t('form.lastName')}
        </label>
        <input
          id="profile-last-name"
          className="form-control"
          type="text"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="profile-email" className="form-label">
          {t('form.email')}
        </label>
        <input
          id="profile-email"
          className="form-control"
          type="email"
          value={user.email}
          disabled
        />
        <span
          className={`badge mt-2 ${user.isVerified ? "bg-success" : "bg-warning text-dark"}`}
        >
          {user.isVerified ? t('profile.verified') : t('profile.unverified')}
        </span>
      </div>

      <div className="mb-4">
        <label htmlFor="profile-phone" className="form-label">
          {t('form.phone')}
        </label>
        <input
          id="profile-phone"
          className="form-control"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={30}
        />
      </div>

      {error && (
        <p role="alert" className="text-danger">
          {translateApiError(error, locale)}
        </p>
      )}
      {saved && (
  <p role="status" className="text-success">
    {t('profile.saved')}
  </p>
)}

      <button type="submit" className="btn btn-danger" disabled={saving}>
        {saving ? t('auth.saving') : t('profile.save')}
      </button>
    </form>
  );
}
