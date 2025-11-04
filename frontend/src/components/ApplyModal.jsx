// frontend/src/components/ApplyModal.jsx
import React, { useEffect, useState } from "react";
import API from "../api";
import toast from "react-hot-toast";

export default function ApplyModal({ gigId, title, onClose, onApplied }) {
  const [skillcards, setSkillcards] = useState([]);
  const [selected, setSelected] = useState("");
  const [loadingCards, setLoadingCards] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // fetch when modal mounts
    fetchSkillcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSkillcards() {
    setLoadingCards(true);
    try {
      console.log("[ApplyModal] fetching skillcards...");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await API.get("/skillcard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const list = res?.data?.skillcards ?? res?.data ?? [];
      const arr = Array.isArray(list) ? list : [];
      setSkillcards(arr);
      if (arr.length) {
        const id = arr[0]._id ?? arr[0].id;
        setSelected(id);
        console.log("[ApplyModal] default selected skillcard:", id);
      } else {
        console.log("[ApplyModal] no skillcards found for this user");
      }
    } catch (err) {
      console.error("[ApplyModal] failed to load skillcards:", err?.response?.data ?? err?.message ?? err);
      setSkillcards([]);
      toast.error("Unable to load SkillCards. Create one first.");
    } finally {
      setLoadingCards(false);
    }
  }

  async function handleApply(e) {
    e.preventDefault();
    if (!selected) {
      toast.error("Choose a SkillCard to apply with.");
      return;
    }
    setSubmitting(true);
    try {
      console.log("[ApplyModal] applying to gig", gigId, "with skillcard", selected);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      // Send both keys so backend accepts either naming convention
      const body = { skillCardId: selected, skillcardId: selected };
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await API.post(`/gigs/${gigId}/apply`, body, { headers });

      console.log("[ApplyModal] apply response:", res?.status, res?.data);
      if (res?.data?.success || res?.status === 200 || res?.status === 201) {
        toast.success("Applied successfully 🎉");
        onApplied && onApplied();
        onClose && onClose();
      } else {
        const errMsg = res?.data?.message ?? "Failed to apply";
        toast.error(errMsg);
      }
    } catch (err) {
      console.error("[ApplyModal] apply failed:", err?.response?.data ?? err?.message ?? err);
      const message = err?.response?.data?.message || err?.message || "Server error";
      toast.error(`Apply failed: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Apply to: {title}</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        {loadingCards ? (
          <p className="text-sm text-gray-500">Loading your SkillCards...</p>
        ) : skillcards.length === 0 ? (
          <div className="text-sm text-gray-500">
            No SkillCards found. Create one first.
            <div className="mt-3">
              <button
                onClick={() => {
                  onClose && onClose();
                  window.location.href = "/create/skillcard";
                }}
                className="px-3 py-2 bg-indigo-600 text-white rounded"
              >
                Create SkillCard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            <label className="block">
              <span className="text-sm text-gray-700">Choose a SkillCard</span>
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  console.log("[ApplyModal] skillcard changed to:", e.target.value);
                }}
                className="mt-1 block w-full border rounded px-3 py-2"
              >
                {skillcards.map((s) => (
                  <option key={s._id ?? s.id} value={s._id ?? s.id}>
                    {(s.title ?? s.name) + (s.level ? ` — ${s.level}` : "")}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={submitting} className="px-3 py-2 bg-indigo-600 text-white rounded">
                {submitting ? "Applying..." : "Apply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
