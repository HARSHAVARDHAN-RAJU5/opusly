// src/components/CreateRoleRedirect.jsx
import React from "react";
import { Navigate } from "react-router-dom";

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
