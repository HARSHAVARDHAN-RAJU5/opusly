import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api";
import ApplyModal from "../components/ApplyModal";
import { jwtDecode } from "jwt-decode";

export default function Dashboard({ onOpenChat, user: passedUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return passedUser || (saved ? JSON.parse(saved) : null);
    } catch {
      return passedUser || null;
    }
  });

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);

  const token = localStorage.getItem("token");
  const tokenUserId = token ? jwtDecode(token)?.id : null;
  const API_BASE =
    (import.meta.env?.VITE_API_URL || import.meta.env?.REACT_APP_API_URL) ??
    "http://localhost:5000";

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

      const normalized = [
        ...posts.map((p) => ({
          ...p,
          _type: "post",
          createdAt: p.createdAt ?? Date.now(),
        })),
        ...gigs.map((g) => ({
          ...g,
          _type: (g.gigType ?? g.type ?? "")
            .toLowerCase()
            .includes("intern")
            ? "internship"
            : "gig",
          createdAt: g.createdAt ?? Date.now(),
        })),
      ].sort(
        (a, b) =>
          (new Date(b.createdAt).getTime() || 0) -
          (new Date(a.createdAt).getTime() || 0)
      );

      setFeed(normalized);
    } catch (err) {
      console.error("Dashboard load error:", err);
      toast.error("Failed to load dashboard content");
    } finally {
      setLoading(false);
    }
  };

  const isInternship = (item) => {
    const text = `${item.title || ""} ${item.gigType || ""} ${
      item.type || ""
    } ${item.category || ""}`.toLowerCase();
    return text.includes("intern");
  };

  // ✅ Prevent self-apply
  const openApplyModal = (gig) => {
    const posterId =
      gig.createdBy?._id ||
      gig.provider?._id ||
      gig.owner?._id ||
      gig.postedBy?._id ||
      null;

    if (posterId && posterId === tokenUserId) {
      toast.error("You can’t apply to your own internship.");
      return;
    }

    setSelectedGig(gig);
    setShowModal(true);
  };

  const closeApplyModal = () => {
    setSelectedGig(null);
    setShowModal(false);
  };

  // ✅ Prevent self-message
  const handleMessage = (item) => {
    try {
      const poster =
        item.createdBy || item.provider || item.owner || item.postedBy;

      const posterId =
        poster?._id ||
        item.createdBy?._id ||
        item.provider?._id ||
        item.owner?._id ||
        item.postedBy?._id;

      if (posterId && posterId === tokenUserId) {
        toast.error("You can’t message yourself.");
        return;
      }

      localStorage.setItem("chatTarget", JSON.stringify(poster));

      const isIntern = isInternship(item);
      const role = user?.role?.toLowerCase();

      let prefillMsg = "";

      if (isIntern) {
        if (role === "provider") {
          prefillMsg = `Hey! You showed interest in the internship "${item.title}". Your SkillCard looks amazing — can we talk further?`;
        } else if (role === "student") {
          prefillMsg = `Hi! I'm interested in the internship "${item.title}". Could we discuss it further?`;
        } else {
          prefillMsg = `Hello! I'm reaching out regarding your internship "${item.title}".`;
        }
      } else {
        prefillMsg = `Hey! I’m really interested in your gig "${item.title}". Can you share more details?`;
      }

      localStorage.setItem("prefillMessage", prefillMsg);
      window.location.reload();
    } catch (err) {
      console.error("handleMessage error:", err);
      toast.error("Unable to open message.");
    }
  };

  const posterName = (item) => {
    if (!item) return "Unknown";
    const p =
      item.postedBy ||
      item.createdBy ||
      item.provider ||
      item.owner ||
      item.applicant;
    if (typeof p === "string") return p;
    return p?.name || p?.email || item.name || "Unknown";
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-semibold text-indigo-600 mb-6">
        Dashboard
      </h1>

      <div className="max-w-4xl mx-auto space-y-4">
        {loading ? (
          <p className="text-gray-500">Loading feed...</p>
        ) : feed.length === 0 ? (
          <p className="text-gray-500">
            No items yet — posts, gigs, and internships will appear here.
          </p>
        ) : (
          feed.map((item) => {
            const key = item._id ?? item.id;
            const intern = isInternship(item);
            const imageUrl = getFirstImageUrl(item);

            if ((item._type ?? "").toLowerCase() === "post") {
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

            // ✅ Gigs / Internships
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
                  {/* ✅ Both Apply & Message for internship */}
                  {intern && (
                    <button
                      onClick={() => openApplyModal(item)}
                      className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      Apply
                    </button>
                  )}
                  <button
                    onClick={() => handleMessage(item)}
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Message
                  </button>
                </div>
              </article>
            );
          })
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
          }}
        />
      )}
    </div>
  );
}
