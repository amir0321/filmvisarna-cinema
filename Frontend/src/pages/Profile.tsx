import { useTranslation } from '../context/LocaleContext'
import { useAuth, getUserInitials, getUserDisplayName } from "../hooks/useAuth";
import ProfileForm from "../components/ProfileForm";
import { useEffect, useState } from "react";
import ChangePasswordForm from "../components/ChangePasswordForm";
import ProfileBookingCount from "../components/ProfileBookingCount";
import { Link } from "react-router";
import { Tabs } from '../components/Tabs'

export default function Profile() {
  const { t } = useTranslation()
 const { user, loading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "security">(
    "personal",
  );

  useEffect(() => {
    void refreshUser().catch(() => {});
  }, [refreshUser]);

 if (loading && !user) {
  return <p className="py-5 text-center" role="status">{t('profile.loading')}</p>;
}

  if (!user) {
    return <p className="py-5 text-center">{t('profile.loginRequired')}</p>;
  }

  return (
    <div className="container py-5">
      <h1 className="h2 fw-bold mb-4">{t('nav.myProfile')}</h1>
<Tabs
  value={activeTab}
  onChange={(value) => setActiveTab(value as 'personal' | 'security')}
  variant="vertical"
>
      <div className="row g-4">
        <aside className="col-12 col-lg-4">
          <div className="card p-4 text-center h-100">
            <div
             className="fv-profile-avatar rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-3"
             aria-hidden="true"
            >
              {getUserInitials(user)}
            </div>

            <h2 className="h5 fw-bold">{getUserDisplayName(user)}</h2>
            <p className="text-secondary">{user.email}</p>

            <div className="d-flex justify-content-center align-items-center gap-5 mt-4">
              <div className="text-center">
                <strong className="fs-4">{user.points ?? 0}</strong>
                <p className="small text-secondary mb-0">{t('profile.points')}</p>
              </div>

              <ProfileBookingCount />
            </div>

            <nav className="d-grid gap-2 mt-4" aria-label={t('profile.menu')}>
<Tabs.List ariaLabel={t('profile.settings')}>
  <Tabs.Trigger value="personal">
    <i className="bi bi-person me-2" aria-hidden="true" />
  {t('profile.personal')}
  </Tabs.Trigger>

  <Tabs.Trigger value="security">
    <i className="bi bi-shield-lock me-2" aria-hidden="true" />
    {t('profile.security')}
  </Tabs.Trigger>
</Tabs.List>


              <Link
                className="btn btn-secondary-outline text-start"
                to="/mina-bokningar"
              >
                <i
                  className="bi bi-ticket-perforated me-2"
                  aria-hidden="true"
                />
                {t('member.title')}
              </Link>
            </nav>
          </div>
        </aside>

        <section className="col-12 col-lg-8">
          <div className="card p-4 h-100">
<Tabs.Panel value="personal">
  <h2 className="h5 fw-bold mb-3">{t('profile.personal')}</h2>
  <ProfileForm user={user} onSaved={refreshUser} />
</Tabs.Panel>

<Tabs.Panel value="security">
  <h2 className="h5 fw-bold mb-3">{t('profile.security')}</h2>
  <p className="text-secondary">
    {t('profile.securityIntro')}
  </p>
  <ChangePasswordForm />
</Tabs.Panel>

          </div>
        </section>
        </div>
      </Tabs>
    </div>
  );
}
