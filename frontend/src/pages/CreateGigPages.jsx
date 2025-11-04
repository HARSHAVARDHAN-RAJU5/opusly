// src/pages/CreateGigPage.jsx
import React, { useEffect, useState } from "react";
import API from "../api";
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

export default function CreateGigPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [aboutService, setAboutService] = useState("");
  const [skills, setSkills] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  // role handling + redirect: if provider, send to internship page
  useEffect(() => {
    const user = getAppUser();
    const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();
    if (role === "provider") {
      // provider shouldn't use the gig page
      navigate("/create/internship", { replace: true });
    }
  }, [navigate]);

  const canSubmit = title.trim() && aboutService.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return toast.error("Title and description are required");

    if (startingPrice && isNaN(Number(startingPrice))) {
      return toast.error("Starting price must be a number");
    }
    if (deliveryTime && isNaN(Number(deliveryTime))) {
      return toast.error("Delivery time must be a number");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: title.trim(),
        description: aboutService.trim(),
        skillsOffered: skills.split(",").map((s) => s.trim()).filter(Boolean),
        price: startingPrice.trim(),
        deliveryTime: deliveryTime.trim(),
        contact: contact.trim(),
        kind: "gig",
      };

      const res = await API.post("/gigs", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.status === 201 || res?.data?.success) {
        toast.success("Your gig is live 🎉");
        // go to dashboard or gig list
        navigate("/");
      } else {
        toast.error(res?.data?.message || "Failed to create gig");
      }
    } catch (err) {
      console.error("Create gig failed:", err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // role badge text (useful if user is also provider but got redirected earlier)
  const user = getAppUser();
  const roleLabel = (user?.role || localStorage.getItem("role") || "student").toString().toLowerCase() === "provider" ? "Provider" : "Student";

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-6 rounded-2xl shadow">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-semibold text-indigo-600">Create Your Gig 💼</h2>
          <span className="text-sm text-gray-500">You are posting as <strong>{roleLabel}</strong></span>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Share what service you can offer — like designing, photography, or editing — so others can hire you directly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="I will edit your videos professionally"
          />

          <textarea
            value={aboutService}
            onChange={(e) => setAboutService(e.target.value)}
            rows="4"
            className="w-full border rounded-md p-2"
            placeholder="Explain what you offer and why clients should choose you."
          />

          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="e.g. photoshop, lightroom, premiere-pro"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="border rounded-md p-2"
              placeholder="Starting Price (₹)"
            />
            <input
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="border rounded-md p-2"
              placeholder="Delivery Time (days)"
            />
          </div>

          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="Contact Info (Instagram/email)"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setAboutService("");
                setSkills("");
                setStartingPrice("");
                setDeliveryTime("");
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
              {loading ? "Publishing..." : "Publish Gig"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
