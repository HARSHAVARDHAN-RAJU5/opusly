import React, { useState } from "react";
import { API } from "../api";

export default function CreateGig() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skills: "",
    stipend: "",
    duration: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()),
      };
      const res = await API.post("/gigs", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.data?.success) {
        alert("Gig created successfully! 🎉");
        setForm({
          title: "",
          description: "",
          skills: "",
          stipend: "",
          duration: "",
        });
      } else {
        alert(res.data?.message || "Failed to create gig.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the gig.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6">Create a Gig</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow max-w-lg space-y-4"
      >
        <input
          type="text"
          name="title"
          placeholder="Gig Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <textarea
          name="description"
          placeholder="Gig Description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          type="text"
          name="skills"
          placeholder="Required Skills (comma separated)"
          value={form.skills}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          type="text"
          name="stipend"
          placeholder="Stipend (optional)"
          value={form.stipend}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          type="text"
          name="duration"
          placeholder="Duration (e.g., 3 months)"
          value={form.duration}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
        >
          Create Gig
        </button>
      </form>
    </div>
  );
}
