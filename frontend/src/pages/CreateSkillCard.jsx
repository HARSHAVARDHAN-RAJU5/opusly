import React, { useEffect, useState } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateSkillCard() {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [tagInput, setTagInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [existing, setExisting] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    setLoadingExisting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/skillcard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res?.data?.skillcards ?? res?.data ?? [];
      setExisting(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to load skillcards", err?.response?.data || err?.message);
      setExisting([]);
    } finally {
      setLoadingExisting(false);
    }
  }

  function addTagFromInput() {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    setSkills((prev) => Array.from(new Set([...prev, ...parts])));
    setTagInput("");
  }

  function handleTagKey(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagFromInput();
    }
  }

  function removeTag(i) {
    setSkills((s) => s.filter((_, idx) => idx !== i));
  }

  async function handleCreate(e) {
    e.preventDefault();

    if (existing.length >= 3) {
      alert("You already have 3 SkillCards.");
      return;
    }

    const payload = { title: name, level, skills };
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/skillcard", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success) {
        alert("SkillCard created successfully 🎉");
        setName("");
        setLevel("Beginner");
        setSkills([]);
        await loadExisting();
      } else {
        alert(res?.data?.message || "Unexpected response from server");
      }
    } catch (err) {
      console.error("Error creating skillcard:", err?.response?.status, err?.response?.data || err?.message);
      alert("SkillCard creation failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setName("");
    setLevel("Beginner");
    setTagInput("");
    setSkills([]);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-indigo-600 mb-4">SkillCards</h1>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-gray-700">SkillCard name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
              placeholder="e.g. Frontend (React)"
              required
            />
          </label>

          <label>
            <span className="text-sm font-medium text-gray-700">Level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </label>
        </div>

        <div className="mb-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Skills / Tags</span>
            <div className="mt-2 flex items-center flex-wrap gap-2">
              {skills.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-sm"
                >
                  {t}
                  <button type="button" onClick={() => removeTag(i)} className="ml-1 text-indigo-500 hover:text-indigo-700">
                    ✕
                  </button>
                </span>
              ))}
              <input
                placeholder="Type a skill and press Enter or comma"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={addTagFromInput}
                className="border rounded px-3 py-2 mt-1 flex-1 min-w-[160px]"
              />
            </div>
          </label>
        </div>

        <div className="flex gap-3 items-center mb-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create"}
          </button>
          <button type="button" onClick={clearForm} className="px-4 py-2 rounded border">
            Clear
          </button>

          <div className="text-sm text-gray-500 ml-auto">
            You can create up to 3 SkillCards. ({existing.length}/3)
          </div>
        </div>

        <hr className="my-3" />

        <h3 className="text-lg font-medium mb-2">Your SkillCards</h3>
        {loadingExisting ? (
          <p className="text-gray-500">Loading your SkillCards...</p>
        ) : existing.length === 0 ? (
          <p className="text-gray-500">No SkillCards yet. Create one to apply for internships.</p>
        ) : (
          <div className="space-y-3">
            {existing.map((c) => (
              <div
                key={c._id ?? c.id}
                className="p-3 border rounded bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-indigo-700">{c.title ?? c.name}</div>
                  <div className="text-xs text-gray-500">
                    {(c.level ?? c.skillLevel) + (c.skills?.length ? ` • ${c.skills.join(", ")}` : "")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
