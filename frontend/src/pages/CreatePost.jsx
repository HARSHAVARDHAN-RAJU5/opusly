import React, { useState } from "react";
import { API } from "../api";

export default function CreatePost() {
  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/posts", form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.data?.success) {
        alert("Post created successfully! 🎉");
        setForm({ title: "", content: "" });
      } else {
        alert(res.data?.message || "Failed to create post.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while creating the post.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6">Create a Post</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow max-w-lg space-y-4"
      >
        <input
          type="text"
          name="title"
          placeholder="Post Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <textarea
          name="content"
          placeholder="Write your content here..."
          value={form.content}
          onChange={handleChange}
          rows={5}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition"
        >
          Publish Post
        </button>
      </form>
    </div>
  );
}
