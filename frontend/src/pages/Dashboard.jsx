import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api";
import ApplyModal from "../components/ApplyModal";
import { jwtDecode } from "jwt-decode";
import FeedItem from "../components/FeedItem";

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

      const posts = resPosts.data.posts ?? resPosts.data ?? [];
      const gigs = resGigs.data.gigs ?? resGigs.data ?? [];

      const normalized = [
        ...posts.map((p) => ({
          ...p,
          _type: "post",
          createdAt: p.createdAt ?? Date.now(),
        })),
        ...gigs.map((g) => ({
          ...g,
          _type:
            (g.gigType ?? g.type ?? "").toLowerCase().includes("intern")
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

      let msg = "";

      if (isIntern) {
        msg =
          role === "provider"
            ? `Hey! You showed interest in "${item.title}". Can we talk?`
            : `Hi! I'm interested in "${item.title}". Can we discuss further?`;
      } else {
        msg = `Hey! I'm interested in your gig "${item.title}".`;
      }

      localStorage.setItem("prefillMessage", msg);
      window.location.reload();
    } catch (err) {
      toast.error("Unable to open message.");
    }
  };
  
const handlePopularity = async (item) => {
  console.log("ITEM:", item);

  try {
    const userId = item.createdBy?._id;

    if (!userId) {
      toast.error("Creator not found for this item.");
      return;
    }

    const res = await API.get(`/popularity/${userId}`);
    toast.success(`Popularity updated: ${res.data.popularity}`);
  } catch (err) {
    console.error("Popularity update error:", err);
    toast.error("Failed to update popularity.");
  }
};


  const posterName = (item) => {
    const p =
      item.postedBy ||
      item.createdBy ||
      item.provider ||
      item.owner ||
      item.applicant;

    if (typeof p === "string") return p;
    return p?.name || p?.email || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-100 m-0 p-0">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-2xl font-semibold text-indigo-600 mb-6">
          Dashboard
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 pb-10">
        {loading ? (
          <p className="text-gray-500">Loading feed...</p>
        ) : feed.length === 0 ? (
          <p className="text-gray-500">
            No items yet — posts, gigs, and internships will appear here.
          </p>
        ) : (
          feed.map((item) => (
            <FeedItem
              key={item._id}
              item={item}
              user={user}
              tokenUserId={tokenUserId}
              isInternship={isInternship}
              posterName={posterName}
              getFirstImageUrl={getFirstImageUrl}
              onApply={openApplyModal}
              onMessage={handleMessage}
              onPopularity={handlePopularity}
            
            />
          ))
        )}
      </div>

      {showModal && selectedGig && (
        <ApplyModal
          gigId={selectedGig._id}
          title={selectedGig.title}
          onClose={closeApplyModal}
          onApplied={async () => {
            toast.success("Applied successfully!");
            closeApplyModal();
            await loadAll();
          }}
        />
      )}
    </div>
  );
}
