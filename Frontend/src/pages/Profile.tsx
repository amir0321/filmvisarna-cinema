import { useAuth, getUserInitials, getUserDisplayName } from "../hooks/useAuth";
import ProfileForm from "../components/ProfileForm";
import { useState } from "react";
import ChangePasswordForm from "../components/ChangePasswordForm";
import ProfileBookingCount from "../components/ProfileBookingCount";
import { Link } from "react-router";

export default function Profile() {
  const { user, loading, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"personal" | "security">(
    "personal",
  );

  if (loading) {
    return <p className="py-5 text-center">Laddar profil...</p>;
  }

  if (!user) {
    return <p className="py-5 text-center">Logga in för att se din profil.</p>;
  }

  return (
    <div className="container py-5">
      <h1 className="h2 fw-bold mb-4">Min profil</h1>

      <div className="row g-4">
        <aside className="col-12 col-lg-4">
          <div className="card p-4 text-center h-100">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-3"
              style={{
                width: 88,
                height: 88,
                backgroundColor: "#E50914",
                color: "#fff",
              }}
            >
              {getUserInitials(user)}
            </div>

            <h2 className="h5 fw-bold">{getUserDisplayName(user)}</h2>
            <p className="text-secondary">{user.email}</p>

            <div className="d-flex justify-content-center align-items-center gap-5 mt-4">
              <div className="text-center">
                <strong className="fs-4">{user.points ?? 0}</strong>
                <p className="small text-secondary mb-0">Poäng</p>
              </div>

              <ProfileBookingCount />
            </div>

            <nav className="d-grid gap-2 mt-4" aria-label="Profilmeny">
              <button
                type="button"
                className={`btn text-start ${
                  activeTab === "personal" ? "btn-danger" : "btn-outline-light"
                }`}
                onClick={() => setActiveTab("personal")}
              >
                <i className="bi bi-person me-2" aria-hidden="true" />
                Personuppgifter
              </button>

              <button
                type="button"
                className={`btn text-start ${
                  activeTab === "security" ? "btn-danger" : "btn-outline-light"
                }`}
                onClick={() => setActiveTab("security")}
              >
                <i className="bi bi-shield-lock me-2" aria-hidden="true" />
                Säkerhet
              </button>

              <Link
                className="btn btn-outline-light text-start"
                to="/mina-bokningar"
              >
                <i
                  className="bi bi-ticket-perforated me-2"
                  aria-hidden="true"
                />
                Mina bokningar
              </Link>
            </nav>
          </div>
        </aside>

        <section className="col-12 col-lg-8">
          <div className="card p-4 h-100">
            {activeTab === "personal" ? (
              <div id="profile-personal-panel" role="tabpanel">
                <h2 className="h5 fw-bold mb-3">Personuppgifter</h2>
                <ProfileForm user={user} onSaved={refreshUser} />
              </div>
            ) : (
              <div id="profile-security-panel" role="tabpanel">
                <h2 className="h5 fw-bold mb-3">Ändra lösenord</h2>
                <p className="text-secondary">
                  Ange ditt nuvarande lösenord och välj ett nytt.
                </p>
                <ChangePasswordForm onPasswordChanged={logout} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
