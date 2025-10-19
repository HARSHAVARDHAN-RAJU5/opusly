import React, { useEffect, useState } from "react";
import { API } from "../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function CreateSkillCard() {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [skillcards, setSkillcards] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLevel, setEditLevel] = useState("Beginner");
  const [editSkills, setEditSkills] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadSkillcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSkillcards = async () => {
    setLoadingList(true);
    try {
      const res = await API.get("/skillcard");
      const list = res?.data?.skillcards ?? res?.data ?? [];
      setSkillcards(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("load skillcards failed:", err?.response?.data || err?.message);
      setSkillcards([]);
    } finally {
      setLoadingList(false);
    }
  };

  const canCreateMore = () => {
    return skillcards.length < 3;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!canCreateMore()) return toast.error("You can only have up to 3 SkillCards");

    const payload = {
      title: title.trim(),
      level,
      skills: skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setLoading(true);
    try {
      const res = await API.post("/skillcard", payload);
      if (res?.status === 201 || res?.data?.success) {
        toast.success("SkillCard created");
        setTitle("");
        setLevel("Beginner");
        setSkillsInput("");
        await loadSkillcards();
      } else {
        toast.error(res?.data?.message || "Failed to create SkillCard");
      }
    } catch (err) {
      console.error("create skillcard failed:", err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Failed to create SkillCard");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (card) => {
    setEditingId(card._id ?? card.id);
    setEditTitle(card.title ?? "");
    setEditLevel(card.level ?? "Beginner");
    setEditSkills(Array.isArray(card.skills) ? card.skills.join(", ") : (card.skills || ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditLevel("Beginner");
    setEditSkills("");
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return toast.error("Title is required");
    setLoading(true);
    try {
      const payload = {
        title: editTitle.trim(),
        level: editLevel,
        skills: editSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await API.put(`/skillcard/${id}`, payload);
      if (res?.data?.success || res?.status === 200) {
        toast.success("Updated");
        cancelEdit();
        await loadSkillcards();
      } else {
        toast.error(res?.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("update failed:", err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (id) => {
    if (!confirm("Delete this SkillCard?")) return;
    setLoading(true);
    try {
      const res = await API.delete(`/skillcard/${id}`);
      if (res?.data?.success || res?.status === 200) {
        toast.success("Deleted");
        if (editingId === id) cancelEdit();
        await loadSkillcards();
      } else {
        toast.error(res?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error("delete failed:", err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex items-start justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-indigo-600 mb-4">Create SkillCard</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="e.g. React + UI"
                disabled={!canCreateMore() || loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none"
                disabled={!canCreateMore() || loading}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills (comma separated)
              </label>
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full border rounded-md p-2 focus:outline-none"
                placeholder="react, tailwind, figma"
                disabled={!canCreateMore() || loading}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-md border"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !canCreateMore()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create SkillCard"}
              </button>
            </div>

            {!canCreateMore() && (
              <p className="text-sm text-red-600 mt-2">You already have 3 SkillCards. Delete one to add another.</p>
            )}
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-indigo-600 mb-4">Your SkillCards</h3>

          {loadingList ? (
            <p className="text-gray-500">Loading...</p>
          ) : skillcards.length === 0 ? (
            <div className="text-sm text-gray-500">No SkillCards yet</div>
          ) : (
            <div className="space-y-3">
              {skillcards.map((s) => {
                const id = s._id ?? s.id;
                const isEditing = editingId === id;
                return (
                  <div key={id} className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      {!isEditing ? (
                        <>
                          <div className="font-medium text-indigo-700">{s.title || s.name}</div>
                          <div className="text-xs text-gray-500">{s.level || s.skillLevel}</div>
                          <div className="text-sm text-gray-700 mt-2">
                            {Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full border rounded-md p-2 focus:outline-none"
                          />
                          <select
                            value={editLevel}
                            onChange={(e) => setEditLevel(e.target.value)}
                            className="w-full border rounded-md p-2 focus:outline-none"
                          >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                          </select>
                          <input
                            value={editSkills}
                            onChange={(e) => setEditSkills(e.target.value)}
                            className="w-full border rounded-md p-2 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-start">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded"
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 border rounded"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(s)}
                            className="px-3 py-1.5 border rounded"
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCard(id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
