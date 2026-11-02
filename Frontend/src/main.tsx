import { getSafeRedirectPath } from './utils/links';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.scss";
import { router } from "./routes.tsx";

function handleUnauthorized() {
  const { pathname, search, hash } = router.state.location;
  // Keep an existing auth destination and its redirect while clearing the session.
  if (/^\/(login|register|reset-password|verify-email)\/?$/i.test(pathname)) return;
  const redirect = getSafeRedirectPath(pathname + search + hash);
  void router.navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider onUnauthorized={handleUnauthorized}>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
