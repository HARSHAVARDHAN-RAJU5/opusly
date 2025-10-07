import React, { useState } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateGig() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [stipend, setStipend] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title,
        description,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        stipend: stipend ? stipend : undefined,
        location: location ? location : undefined,
      };

      const res = await API.post("/gigs", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        alert("Gig created successfully 🎉");
        navigate("/");
      } else {
        alert(res.data?.message || "Failed to create gig");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating gig");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">Create Gig / Internship</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Frontend Intern"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="Describe the role and responsibilities..."
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Required Skills (comma separated)</span>
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="react, node, css"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <label>
            <span className="text-sm font-medium text-gray-700">Stipend (optional)</span>
            <input
              value={stipend}
              onChange={(e) => setStipend(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="₹5000"
            />
          </label>

          <label>
            <span className="text-sm font-medium text-gray-700">Location (optional)</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="Remote / City"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
            Create Gig
          </button>
          <button type="button" onClick={() => navigate("/")} className="px-4 py-2 rounded border">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
