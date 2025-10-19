// src/components/RequireAuth.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Lightweight auth guard that:
 * - checks for token OR window/app user OR localStorage user
 * - if requiredRole is set, enforces role (falls back to localStorage "role")
 *
 * This avoids requiring a missing AuthContext while still protecting routes.
 */
export default function RequireAuth({ children, requiredRole }) {
  // token check
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // try window app user
  const winUser = typeof window !== "undefined" ? window.__APP_USER__ : null;

  // try parsing localStorage user
  let localUser = null;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) localUser = JSON.parse(raw);
  } catch (e) {}

  // fallback role string
  const roleStr = (typeof window !== "undefined" ? localStorage.getItem("role") : null) || "";

  // if nothing at all, redirect to login
  if (!token && !winUser && !localUser) {
    return <Navigate to="/login" replace />;
  }

  const role =
    (winUser && winUser.role) ||
    (localUser && localUser.role) ||
    roleStr ||
    "";

  if (requiredRole && String(role).toLowerCase() !== String(requiredRole).toLowerCase()) {
    // user isn't authorized for this page
    return <Navigate to="/create" replace />;
  }

  return children;
}
