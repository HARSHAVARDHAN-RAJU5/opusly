// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { API } from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ApplyModal from "../components/ApplyModal";

export default function Dashboard({ onOpenChat, user }) {
  const [feed, setFeed] = useState([]);
  const [skillcards, setSkillcards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSkillcards, setLoadingSkillcards] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Base URL for images
  const API_BASE = (import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL)) || "http://localhost:5000";

  // helper for image display
  const getFirstImageUrl = (post) => {
    if (!post) return null;
    let img = post.image || (Array.isArray(post.images) && post.images[0]) || post.photo || (Array.isArray(post.photos) && post.photos[0]);
    if (!img) return null;
    if (typeof img === "string" && img.startsWith("http")) return img;
    return `${API_BASE}/${String(img).replace(/^\/+/, "")}`;
  };

  // Load dashboard data
  useEffect(() => {
    loadAll();
    loadSkillcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [resPosts, resGigs] = await Promise.all([
        API.get("/posts", { headers }),
        API.get("/gigs", { headers }),
      ]);

      const posts = resPosts?.data?.posts ?? resPosts?.data ?? [];
      const gigs = resGigs?.data?.gigs ?? resGigs?.data ?? [];

      const normalizedPosts = posts.map((p) => ({
        ...p,
        _type: "post",
        createdAt: p.createdAt ?? Date.now(),
      }));

      const normalizedGigs = gigs.map((g) => ({
        ...g,
        _type: ((g.gigType ?? g.type ?? "") + "").toString().toLowerCase().includes("intern") ? "internship" : "gig",
        createdAt: g.createdAt ?? Date.now(),
      }));

      const merged = [...normalizedPosts, ...normalizedGigs].sort((a, b) => {
        const da = new Date(a.createdAt).getTime() || 0;
        const db = new Date(b.createdAt).getTime() || 0;
        return db - da;
      });

      setFeed(merged);
    } catch (err) {
      console.error("Dashboard: Failed to load feed:", err?.response?.data || err?.message || err);
      toast.error("Failed to load dashboard content");
      setFeed([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSkillcards = async () => {
    setLoadingSkillcards(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await API.get("/skillcard", { headers });
      const list = res?.data?.skillcards ?? res?.data ?? [];
      setSkillcards(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to load skillcards", err?.response?.data || err?.message || err);
      setSkillcards([]);
    } finally {
      setLoadingSkillcards(false);
    }
  };

  const isInternship = (item) => {
    if (!item) return false;
    const title = (item.title || item.name || "").toString().toLowerCase();
    const type = (item.gigType || item.type || item._type || "").toString().toLowerCase();
    if (title.includes("intern")) return true;
    if (type.includes("intern")) return true;
    return false;
  };

  const openApplyModal = (gig) => {
    console.log("[DEBUG] Apply button clicked for gig:", gig?._id ?? gig?.id);
    setSelectedGig(gig);
    setShowModal(true);
  };

  const handleMessage = (item) => {
    const chatId = item.createdBy?._id ?? item.createdBy ?? item.provider ?? item.owner ?? item._id ?? item.id;
    const name = item.createdBy?.name ?? item.provider?.name ?? item.owner?.name ?? item.title ?? item.name ?? "Chat";
    if (typeof onOpenChat === "function") {
      onOpenChat({ id: chatId, name });
    } else {
      navigate(`/chat/${encodeURIComponent(String(chatId))}`);
    }
  };

  const posterName = (item) => {
    return item.createdBy?.name || item.provider?.name || item.owner?.name || "Unknown";
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-semibold text-indigo-600 mb-6">Dashboard</h1>

      <div className="max-w-4xl mx-auto space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading feed...</p>
        ) : feed.length === 0 ? (
          <p className="text-gray-500">No items yet — posts, gigs and internships will appear here.</p>
        ) : (
          feed.map((item) => {
            const key = item._id ?? item.id ?? JSON.stringify(item);
            const intern = isInternship(item);

            if ((item._type ?? "").toString().toLowerCase() === "post") {
              const imageUrl = getFirstImageUrl(item);
              return (
                <article key={key} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                  <h2 className="font-semibold text-indigo-700">{item.title ?? "Post"}</h2>
                  <p className="text-xs text-gray-500">Posted by {posterName(item)}</p>
                  <p className="text-sm text-gray-600 mt-2">{item.content ?? item.description}</p>
                  {imageUrl && <img src={imageUrl} alt="post" className="mt-3 w-full max-h-80 object-cover rounded-lg border" />}
                </article>
              );
            }

            return (
              <article key={key} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-indigo-700">{item.title ?? item.name}</h2>
                    <p className="text-xs text-gray-500">Posted by {posterName(item)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${intern ? "text-green-700 bg-green-50" : "text-indigo-600 bg-indigo-50"}`}>
                    {intern ? "Internship" : "Gig"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-2">{item.content ?? item.description}</p>

                {Array.isArray(item.skills) && item.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.skills.map((s, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {intern ? (
                    (user && (user.role || "").toString().toLowerCase() === "student" && String(item.createdBy?._id ?? item.createdBy) !== String(user._id ?? user.id)) ? (
                      <button onClick={() => openApplyModal(item)} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Apply</button>
                    ) : (
                      <button type="button" onClick={() => toast.error("You can't apply to this internship")} className="text-sm bg-gray-200 text-gray-600 px-3 py-1 rounded cursor-not-allowed" disabled>Apply</button>
                    )
                  ) : (
                    <button onClick={() => handleMessage(item)} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Message</button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Side widgets */}
      <div className="fixed right-6 top-24 w-80">
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="font-semibold text-indigo-700 mb-2">Quick Actions</div>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate("/create/gig")} className="text-sm w-full text-left px-3 py-2 border rounded hover:bg-indigo-50">Create Gig</button>
            <button onClick={() => navigate("/create/post")} className="text-sm w-full text-left px-3 py-2 border rounded hover:bg-indigo-50">Create Post</button>
            <button onClick={() => navigate("/create/skillcard")} className="text-sm w-full text-left px-3 py-2 border rounded hover:bg-indigo-50">Create SkillCard</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="font-semibold text-indigo-700 mb-2">Your SkillCards</div>
          {loadingSkillcards ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : skillcards.length === 0 ? (
            <p className="text-sm text-gray-500">No SkillCards yet</p>
          ) : (
            skillcards.map((s) => (
              <div key={s._id ?? s.id} className="p-2 border rounded mb-2">
                <div className="font-medium">{s.title ?? s.name}</div>
                <div className="text-xs text-gray-500">{s.level ?? s.skillLevel} • {Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && selectedGig && (
        <ApplyModal
          gigId={selectedGig._id ?? selectedGig.id}
          title={selectedGig.title ?? selectedGig.name ?? "Internship"}
          onClose={() => setShowModal(false)}
          onApplied={async () => {
            toast.success("Applied successfully 🎉");
            setShowModal(false);
            setSelectedGig(null);
            // refresh to show updated state
            await loadAll();
            await loadSkillcards();
          }}
        />
      )}
    </div>
  );
}
