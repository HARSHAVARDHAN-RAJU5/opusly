// frontend/src/pages/MyApplications.jsx
import React, { useEffect, useState } from "react";
import API from "../api";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/gigs/applied", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // backend may return different shapes: array directly or { success, applications } or { applied }
      let data = res?.data;
      let apps = [];

      if (!data) apps = [];
      else if (Array.isArray(data)) apps = data;
      else if (Array.isArray(data.applications)) apps = data.applications;
      else if (Array.isArray(data.applied)) apps = data.applied;
      else if (Array.isArray(data.data)) apps = data.data;
      else if (data.success && Array.isArray(data.items)) apps = data.items;
      else apps = [];

      setApplications(apps);
    } catch (err) {
      console.error("Failed to load applications", err?.response?.data ?? err?.message ?? err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">My Applications</h2>

      {loading ? (
        <p className="text-gray-500">Loading your applications...</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-500">You haven’t applied to anything yet.</p>
      ) : (
        applications.map((a) => {
          // application object might be { gig, skillCard, createdAt } or { gigId, gig, skillCardId, skillCard }
          const gig = a.gig ?? a.post ?? a.item ?? (a.gigId ? { title: a.title, _id: a.gigId } : null);
          const skillcard = a.skillCard ?? a.skillcard ?? a.skillCardId ?? a.skillcardId ?? null;

          const title = gig?.title ?? gig?.name ?? "Untitled gig";
          const description = gig?.description ?? gig?.content ?? gig?.desc ?? "";
          const poster = gig?.createdBy?.name ?? gig?.provider?.name ?? gig?.owner?.name ?? "Unknown";

          return (
            <div key={a._id ?? a.id ?? `${gig?._id ?? gig?.id}-${skillcard ?? "s"}`} className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">{title}</p>
                <p className="text-sm text-gray-600">{(description || "").slice(0, 120)}</p>
                <p className="text-xs text-gray-400 mt-1">Provider: {poster}</p>
                {skillcard && (
                  <p className="text-xs mt-1 text-indigo-700">
                    Applied with: {typeof skillcard === "string" ? skillcard : skillcard.title ?? skillcard.name ?? skillcard._id}
                  </p>
                )}
              </div>
              <span className="text-indigo-600 text-sm font-medium">Interested</span>
            </div>
          );
        })
      )}
    </div>
  );
}
