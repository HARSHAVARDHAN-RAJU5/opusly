// src/pages/CreateService.jsx
import React, { useState } from "react";
import { API } from "../api";
import toast from "react-hot-toast";

/*
  Usage:
   - Put this file at src/pages/CreateService.jsx
   - Navigate to it as the route you already use for create/gig
   - It auto-switches form based on role:
       role === "provider" -> shows Internship form (with stipend, location)
       otherwise (student or no role) -> shows Gig form (Fiverr-like)
   - Role is read from localStorage.getItem("role") (same place your app stores it).
     If you store role elsewhere, pass it in or adapt the role detection.
*/

function CreateGigForm() {
  const [title, setTitle] = useState("");
  const [aboutService, setAboutService] = useState("");
  const [skills, setSkills] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !aboutService.trim())
      return toast.error("Title and service description are required");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: title.trim(),
        description: aboutService.trim(),
        skillsOffered: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
        setTitle("");
        setAboutService("");
        setSkills("");
        setStartingPrice("");
        setDeliveryTime("");
        setContact("");
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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-2">
          Create Your Gig 💼
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Share what service you can offer — like designing, photography, or editing —
          so others can hire you directly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Gig Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="I will edit your videos professionally"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Describe Your Service</label>
            <textarea
              value={aboutService}
              onChange={(e) => setAboutService(e.target.value)}
              rows="4"
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Explain what you offer, what tools you use, and why clients should choose you."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Skills / Tools (comma separated)</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. photoshop, lightroom, premiere-pro"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Starting Price (₹)</label>
              <input
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. 800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Delivery Time (days)</label>
              <input
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Info (where clients can reach you)</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. your Instagram handle or email"
            />
          </div>

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
              disabled={loading}
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

function CreateInternshipForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [stipend, setStipend] = useState("");
  const [location, setLocation] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim())
      return toast.error("Title and description are required");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: title.trim(),
        description: description.trim(),
        skills: requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        stipend: stipend.trim(),
        location: location.trim(),
        durationWeeks: durationWeeks.trim(),
        contact: contact.trim(),
        kind: "internship",
      };

      // Post to same gigs endpoint but mark as internship (backend should accept)
      const res = await API.post("/gigs", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res?.status === 201 || res?.data?.success) {
        toast.success("Internship posted 🎉");
        setTitle("");
        setDescription("");
        setRequiredSkills("");
        setStipend("");
        setLocation("");
        setDurationWeeks("");
        setContact("");
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

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-2">
          Create Internship 💼
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Post an internship so students can apply directly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Frontend Intern"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Required Skills (comma separated)</label>
            <input
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="react, node, css"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stipend (optional)</label>
              <input
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="₹5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location (optional)</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Remote / City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (weeks)</label>
              <input
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. 8"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Info</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="email or instagram handle"
            />
          </div>

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
              disabled={loading}
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

export default function CreateService() {
  // determine role: provider -> show internship form, otherwise show gig form
  const role = (localStorage.getItem("role") || "").toLowerCase(); // "provider" or "student"
  return role === "provider" ? <CreateInternshipForm /> : <CreateGigForm />;
}
