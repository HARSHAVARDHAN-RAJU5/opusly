import React, { useEffect, useState } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard({ onOpenChat }) {
  const [feed, setFeed] = useState([]);
  const [skillcards, setSkillcards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [loadingApply, setLoadingApply] = useState(false);
  const [loadingSkillcards, setLoadingSkillcards] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [resPosts, resGigs] = await Promise.all([
        API.get("/posts"),
        API.get("/gigs"),
      ]);
      const posts = resPosts?.data?.posts ?? resPosts?.data ?? [];
      const gigs = resGigs?.data?.gigs ?? resGigs?.data ?? [];

      const normalizedPosts = posts.map((p) => ({
        ...p,
        _type: "post",
        createdAt: p.createdAt ?? p._id,
      }));
      const normalizedGigs = gigs.map((g) => ({
        ...g,
        _type:
          g.type === "internship"
            ? "internship"
            : g._type ?? g.type ?? "gig",
        createdAt: g.createdAt ?? g._id,
      }));

      const merged = [...normalizedPosts, ...normalizedGigs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setFeed(merged);
    } catch (err) {
      console.error("Dashboard: Failed to load feed:", err?.response?.data || err?.message);
      setFeed([]);
    }
  }

  const extractId = (val) => {
    if (!val) return undefined;
    if (typeof val === "object") {
      return String(val._id ?? val.id ?? JSON.stringify(val));
    }
    return String(val);
  };

  const isInternship = (item) => {
    if (!item) return false;
    const lowTitle = (item.title ?? item.name ?? "").toLowerCase();
    const t = (item._type ?? item.type ?? item.category ?? "").toLowerCase();
    if (item.isInternship || t.includes("intern")) return true;
    if (lowTitle.includes("intern")) return true;
    return false;
  };

  const loadSkillcards = async () => {
    setLoadingSkillcards(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/skillcard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const list = res?.data?.skillcards ?? res?.data ?? [];
      setSkillcards(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to load skillcards", err?.response?.data || err?.message);
      setSkillcards([]);
    } finally {
      setLoadingSkillcards(false);
    }
  };

  const openApplyModal = async (gig) => {
    setSelectedGig(gig);
    await loadSkillcards();
    setShowModal(true);
  };

  const confirmApply = async (cardId) => {
    if (!selectedGig) return alert("No internship selected.");
    setLoadingApply(true);
    try {
      const token = localStorage.getItem("token");
      const gigId = selectedGig._id ?? selectedGig.id;
      const res = await API.post(
        `/gigs/${gigId}/apply`,
        { skillCardId: cardId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res?.data?.success ?? res?.data?.applied) {
        alert("Applied successfully 🎉");
        setShowModal(false);
        setSelectedGig(null);
        await loadAll();
      } else {
        alert(res?.data?.message ?? "Applied (server returned unknown response).");
      }
    } catch (err) {
      console.error("Apply failed:", err?.response?.data || err?.message);
      alert("Failed to apply. Check console for details.");
    } finally {
      setLoadingApply(false);
    }
  };

  const handleMessage = async (item) => {
    const chatIdRaw = item.provider ?? item.owner ?? item.userId ?? item.createdBy ?? item._id ?? item.id;
    const chatId = extractId(chatIdRaw) ?? item.title ?? `chat-${Date.now()}`;
    const friendlyName = item.providerName ?? item.ownerName ?? item.title ?? item.name ?? `chat-${chatId}`;

    if (typeof onOpenChat === "function") {
      onOpenChat({ id: chatId, name: friendlyName });
      return;
    }

    navigate(`/chat/${encodeURIComponent(chatId)}`);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-semibold text-indigo-600 mb-6">Dashboard</h1>

      <div className="max-w-4xl mx-auto space-y-4">
        {feed.length === 0 ? (
          <p className="text-gray-500">
            No items yet — posts, gigs and internships will appear here.
          </p>
        ) : (
          feed.map((item) => {
            const intern = isInternship(item);

            if ((item._type ?? "").toLowerCase() === "post") {
              return (
                <article
                  key={item._id ?? item.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
                >
                  <h2 className="font-semibold text-indigo-700">{item.title}</h2>
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                </article>
              );
            }

            return (
              <article
                key={item._id ?? item.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-indigo-700">{item.title}</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      intern
                        ? "text-green-700 bg-green-50"
                        : "text-indigo-600 bg-indigo-50"
                    }`}
                  >
                    {intern ? "Internship" : "Gig"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-2">{item.description}</p>

                {item.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {intern ? (
                    <button
                      onClick={() => openApplyModal(item)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMessage(item)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Message
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {showModal && selectedGig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Apply to: {selectedGig.title}</h3>
              <button
                className="text-gray-500"
                onClick={() => {
                  setShowModal(false);
                  setSelectedGig(null);
                }}
              >
                ✕
              </button>
            </div>

            {loadingSkillcards ? (
              <p className="text-gray-500">Loading your SkillCards...</p>
            ) : skillcards.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-3">You don't have any SkillCards yet.</p>
                <button
                  onClick={() => {
                    setShowModal(false);
                    navigate("/create/skillcard");
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  Create SkillCard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto mb-4">
                {skillcards.map((c) => (
                  <div
                    key={c._id ?? c.id}
                    className="p-3 border rounded flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-indigo-700">{c.name}</div>
                      <div className="text-xs text-gray-500">
                        {c.level ?? c.skillLevel}
                      </div>
                    </div>
                    <button
                      onClick={() => confirmApply(c._id ?? c.id)}
                      disabled={loadingApply}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loadingApply ? "Applying..." : "Apply with this"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedGig(null);
                }}
                className="px-3 py-1.5 border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
