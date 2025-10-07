// src/components/GigCard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * GigCard - simple card for a gig with Apply button for students.
 * - Expects a `gig` prop with at least {_id, title, provider, description}
 * - backend apply endpoint assumed: POST /api/gigs/:id/apply
 *   -> change APPLY_URL_BASE if your backend differs
 */

const APPLY_URL_BASE = "/api/gigs"; // set to your backend base for gigs if different

export default function GigCard({ gig }) {
  const navigate = useNavigate();
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // determine role from localStorage (consistent with your auth usage earlier)
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const token = localStorage.getItem("token");

  // Optional: check if user already applied — if you have an API for that, call it here.
  // For now we assume gig object may contain `alreadyApplied` boolean (set from backend)
  useEffect(() => {
    if (gig?.alreadyApplied) setApplied(true);
  }, [gig]);

  const handleApply = async () => {
    setError("");
    if (role !== "student") {
      // if freelancer, take them to messages instead of applying
      return navigate("/messages");
    }
    if (!token) {
      setError("Not authenticated. Please login.");
      return navigate("/login");
    }

    setLoading(true);
    try {
      const res = await fetch(`${APPLY_URL_BASE}/${gig._id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to apply");
      }

      // success
      setApplied(true);
    } catch (err) {
      console.error("Apply error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{gig.title}</h3>
          <p className="text-xs text-gray-500">by {gig.provider?.name || "Provider"}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Apply button behavior:
              - students: apply
              - freelancers: takes to messages
          */}
          <button
            onClick={handleApply}
            disabled={loading || applied}
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              applied
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {loading ? "Applying..." : applied ? "Applied" : role === "student" ? "Apply" : "Message"}
          </button>

          <button
            onClick={() => navigate(`/gigs/${gig._id}`)}
            className="text-xs text-indigo-600 hover:underline"
          >
            View
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 line-clamp-3">{gig.description}</p>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
