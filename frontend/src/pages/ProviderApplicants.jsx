import React, { useEffect, useState } from "react";
import API from "../api";

export default function ProviderApplicants() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApplicants();
  }, []);

  async function loadApplicants() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/gigs/all-applicants", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setApplications(res.data.applications || []);
      console.log("All applicants response:", res.data);
    } catch (err) {
      console.error("Failed to load applicants:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">All Applicants</h2>

      {loading ? (
        <p className="text-gray-500">Loading applicants...</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-500">No applicants yet.</p>
      ) : (
        applications.map((a) => (
          <div
            key={a._id}
            className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">
                {a.applicant?.name || "Unknown"}
              </p>
              <p className="text-sm text-gray-600">
                Applied for: {a.gig?.title || "Untitled gig"}
              </p>
              {a.skillCard && (
                <p className="text-xs mt-1 text-indigo-700">
                  SkillCard: {a.skillCard?.title}
                </p>
              )}
            </div>
            <span className="text-indigo-600 text-sm font-medium">
              {a.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
