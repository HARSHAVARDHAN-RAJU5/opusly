import React, { useEffect, useState } from "react";
import API from "../api";
import toast from "react-hot-toast";

export default function ProviderApplicants() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

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
      toast.error("Unable to fetch applicants");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Show skill popup
  const openSkillPopup = (application) => {
    setSelectedApplicant(application);
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedApplicant(null);
    setShowPopup(false);
  };

  // ✅ Prefilled message logic
  const handleMessage = (app) => {
    try {
      const target = app.applicant;
      if (!target?._id) return toast.error("Applicant not found");

      localStorage.setItem("chatTarget", JSON.stringify(target));

      const prefillMsg = `Hey ${target.name || ""}! You showed interest in the internship "${
        app.gig?.title || "this position"
      }". Your SkillCard looks amazing — can we talk further?`;

      localStorage.setItem("prefillMessage", prefillMsg);
      window.location.reload();
    } catch (err) {
      console.error("Message open failed:", err);
      toast.error("Unable to open chat");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
        All Applicants
      </h2>

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
            {/* Left Section */}
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

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => openSkillPopup(a)}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                SkillCard
              </button>

              <button
                onClick={() => handleMessage(a)}
                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
              >
                Message
              </button>

              <span className="text-indigo-600 text-sm font-medium">
                {a.status}
              </span>
            </div>
          </div>
        ))
      )}

      {/* SkillCard Popup */}
      {showPopup && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative">
            <h2 className="text-lg font-semibold text-indigo-600 mb-3">
              {selectedApplicant.applicant?.name}'s SkillCard
            </h2>

            <p className="text-gray-700 mb-2">
              <strong>Applied for:</strong>{" "}
              {selectedApplicant.gig?.title || "Untitled gig"}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Skill:</strong>{" "}
              {selectedApplicant.skillCard?.title || "Frontend Developer"}
            </p>
            <p className="text-gray-600 text-sm mb-4">
              {selectedApplicant.skillCard?.description ||
                "No additional details provided."}
            </p>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => handleMessage(selectedApplicant)}
                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
              >
                Message
              </button>
              <button
                onClick={closePopup}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
