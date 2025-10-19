// src/components/CreateRoleRedirect.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Redirects /create to role-specific create pages.
 * It will try, in order:
 * 1) window.__APP_USER__ (if your App sets it)
 * 2) localStorage 'user' (json string)
 * 3) localStorage 'role' (string)
 *
 * This avoids depending on a missing AuthContext.
 */
export default function CreateRoleRedirect() {
  // try window-cached user (App can set window.__APP_USER__ = user)
  const winUser = typeof window !== "undefined" ? window.__APP_USER__ : null;

  // try localStorage user json
  let localUser = null;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) localUser = JSON.parse(raw);
  } catch (e) {
    // ignore parse errors
  }

  // fallback plain role string
  const roleStr = (typeof window !== "undefined" ? localStorage.getItem("role") : null) || "";

  const role =
    (winUser && winUser.role) ||
    (localUser && localUser.role) ||
    roleStr ||
    "";

  const normalized = String(role).toLowerCase();

  if (normalized === "provider") {
    return <Navigate to="/create/internship" replace />;
  } else {
    return <Navigate to="/create/gig" replace />;
  }
}
