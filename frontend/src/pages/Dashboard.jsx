// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api";
import ApplyModal from "../components/ApplyModal";

export default function Dashboard({ onOpenChat, user: passedUser }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return passedUser || (saved ? JSON.parse(saved) : null);
    } catch {
      return passedUser || null;
    }
  });

  const [feed, setFeed] = useState([]);
  const [skillcards, setSkillcards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSkillcards, setLoadingSkillcards] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const API_BASE =
    (import.meta.env?.VITE_API_URL || import.meta.env?.REACT_APP_API_URL) ??
    "http://localhost:5000";

  // Helper — image resolver
  const getFirstImageUrl = (post) => {
    if (!post) return null;
    const img =
      post.image ||
      (Array.isArray(post.images) && post.images[0]) ||
      post.photo ||
      (Array.isArray(post.photos) && post.photos[0]);
    if (!img) return null;
    if (typeof img === "string" && img.startsWith("http")) return img;
    return `${API_BASE}/${String(img).replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    loadAll();
    loadSkillcards();
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
        _type: (g.gigType ?? g.type ?? "")
          .toString()
          .toLowerCase()
          .includes("intern")
          ? "internship"
          : "gig",
        createdAt: g.createdAt ?? Date.now(),
      }));

      const merged = [...normalizedPosts, ...normalizedGigs].sort(
        (a, b) =>
          (new Date(b.createdAt).getTime() || 0) -
          (new Date(a.createdAt).getTime() || 0)
      );

      setFeed(merged);
    } catch (err) {
      console.error("Dashboard load error:", err?.response?.data || err.message);
      toast.error("Failed to load dashboard content");
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
      console.warn("Failed to load skillcards:", err.message);
      setSkillcards([]);
    } finally {
      setLoadingSkillcards(false);
    }
  };

  // Better internship detection
  const isInternship = (item) => {
    const text = `${item.title || ""} ${item.name || ""} ${item.gigType || ""} ${
      item.type || ""
    } ${item.category || ""}`.toLowerCase();
    return text.includes("intern");
  };

  const openApplyModal = (gig) => {
    console.log("openApplyModal fired:", gig);
    setSelectedGig(gig);
    setShowModal(true);
  };

  const closeApplyModal = () => {
    setSelectedGig(null);
    setShowModal(false);
  };

  const handleMessage = (item) => {
    const chatId =
      item.createdBy?._id ??
      item.createdBy ??
      item.provider ??
      item.owner ??
      item._id ??
      item.id;

    const name =
      item.createdBy?.name ??
      item.provider?.name ??
      item.owner?.name ??
      item.title ??
      item.name ??
      "Chat";

    setChatOpen(true);

    if (typeof onOpenChat === "function") {
      onOpenChat({ id: chatId, name });
    } else {
      navigate(`/chat/${encodeURIComponent(String(chatId))}`);
    }
  };

  const posterName = (item) => {
    if (!item) return "Unknown";
    if (typeof item.postedBy === "string" && item.postedBy.trim())
      return item.postedBy;
    if (item.createdBy?.name || item.createdBy?.email)
      return item.createdBy.name || item.createdBy.email;
    if (item.provider?.name || item.provider?.email)
      return item.provider.name || item.provider.email;
    if (item.owner?.name || item.owner?.email)
      return item.owner.name || item.owner.email;
    return item.name || item.title || "Unknown";
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-semibold text-indigo-600 mb-6">
        Dashboard
      </h1>

      {/* Feed */}
      <div className="max-w-4xl mx-auto space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading feed...</p>
        ) : feed.length === 0 ? (
          <p className="text-gray-500">
            No items yet — posts, gigs, and internships will appear here.
          </p>
        ) : (
          feed.map((item) => {
            const key = item._id ?? item.id ?? JSON.stringify(item);
            const intern = isInternship(item);

            // Post card
            if ((item._type ?? "").toLowerCase() === "post") {
              const imageUrl = getFirstImageUrl(item);
              return (
                <article
                  key={key}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
                >
                  <h2 className="font-semibold text-indigo-700">
                    {item.title ?? "Post"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Posted by {posterName(item)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {item.content ?? item.description}
                  </p>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="post"
                      className="mt-3 w-full max-h-80 object-cover rounded-lg border"
                    />
                  )}
                </article>
              );
            }

            // Gig / Internship card
            return (
              <article
                key={key}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-indigo-700">
                      {item.title ?? item.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Posted by {posterName(item)}
                    </p>
                  </div>
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

                <p className="text-sm text-gray-600 mt-2">
                  {item.content ?? item.description}
                </p>

                {Array.isArray(item.skills) && item.skills.length > 0 && (
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

      {/* Right Sidebar */}
      <div className="fixed right-6 top-24 w-80 z-10">
        {!chatOpen && (
          <div className="bg-white p-4 rounded shadow mb-4">
            <div className="font-semibold text-indigo-700 mb-2">
              Quick Actions
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/create/gig")}
                className="text-sm w-full text-left px-3 py-2 border rounded hover:bg-indigo-50"
              >
                Create Gig
              </button>
              <button
                onClick={() => navigate("/create/post")}
                className="text-sm w-full text-left px-3 py-2 border rounded hover:bg-indigo-50"
              >
                Create Post
              </button>
              <button
                onClick={() => navigate("/create/skillcard")}
                className="text-sm w-full text-left px-3 py-2 border rounded hover:bg-indigo-50"
              >
                Create SkillCard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showModal && selectedGig && (
        <ApplyModal
          gigId={selectedGig._id ?? selectedGig.id}
          title={selectedGig.title ?? selectedGig.name ?? "Internship"}
          onClose={closeApplyModal}
          onApplied={async () => {
            toast.success("Applied successfully!");
            setShowModal(false);
            setSelectedGig(null);
            await loadAll();
            await loadSkillcards();
          }}
        />
      )}
    </div>
  );
}
