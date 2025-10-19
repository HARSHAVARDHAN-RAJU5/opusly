// src/pages/CreateInternshipPage.jsx
import React, { useEffect, useState } from "react";
import { API } from "../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function getAppUser() {
  if (typeof window !== "undefined" && window.__APP_USER__) return window.__APP_USER__;
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export default function CreateInternshipPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [stipend, setStipend] = useState("");
  const [location, setLocation] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  // role handling + redirect: if NOT provider, send to gig page
  useEffect(() => {
    const user = getAppUser();
    const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();
    if (role !== "provider") {
      // non-providers shouldn't use the internship page
      navigate("/create/gig", { replace: true });
    }
  }, [navigate]);

  const canSubmit = title.trim() && description.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return toast.error("Title and description are required");

    if (stipend && isNaN(Number(stipend))) {
      return toast.error("Stipend must be a number");
    }
    if (durationWeeks && isNaN(Number(durationWeeks))) {
      return toast.error("Duration must be a number");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: title.trim(),
        description: description.trim(),
        skills: requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        stipend: stipend.trim(),
        location: location.trim(),
        durationWeeks: durationWeeks.trim(),
        contact: contact.trim(),
        kind: "internship",
      };

      const res = await API.post("/gigs", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.status === 201 || res?.data?.success) {
        toast.success("Internship posted 🎉");
        navigate("/provider");
      } else {
        toast.error(res?.data?.message || "Failed to create internship");
      }
    } catch (err) {
      console.error("Create internship failed:", err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const user = getAppUser();
  const roleLabel = (user?.role || localStorage.getItem("role") || "provider").toString().toLowerCase() === "provider" ? "Provider" : "Student";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-6 rounded-2xl shadow">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-600">Create Internship 💼</h2>
          <span className="text-sm text-gray-500">You are posting as <strong>{roleLabel}</strong></span>
        </div>

        <p className="text-sm text-gray-500 mb-6">Post an internship so students can apply directly.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="Frontend Intern"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full border rounded-md p-2"
            placeholder="Describe the role and responsibilities..."
          />

          <input
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="react, node, css"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={stipend}
              onChange={(e) => setStipend(e.target.value)}
              className="border rounded-md p-2"
              placeholder="Stipend (₹)"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border rounded-md p-2"
              placeholder="Remote / City"
            />
            <input
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              className="border rounded-md p-2"
              placeholder="Duration (weeks)"
            />
          </div>

          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="Contact Info (email / insta)"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setDescription("");
                setRequiredSkills("");
                setStipend("");
                setLocation("");
                setDurationWeeks("");
                setContact("");
              }}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Internship"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
