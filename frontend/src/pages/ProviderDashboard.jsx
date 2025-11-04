import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function ProviderDashboard() {
  const [posts, setPosts] = useState([]);
  const [gigs, setGigs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [resPosts, resGigs] = await Promise.all([
          API.get("/posts", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          API.get("/gigs", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);

        setPosts(resPosts.data?.posts ?? []);
        setGigs(resGigs.data?.gigs ?? []);
      } catch (err) {
        console.error("Failed to load provider data:", err);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">
        Provider Dashboard
      </h1>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <Link
          to="/create-post"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + Create Post
        </Link>
        <Link
          to="/create-gig"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow"
        >
          + Create Gig
        </Link>
      </div>

      {/* My Gigs */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-indigo-600">My Gigs</h2>
        {gigs.length === 0 ? (
          <p className="text-gray-500">You haven’t created any gigs yet.</p>
        ) : (
          gigs.map((g) => (
            <div
              key={g._id}
              className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{g.title}</p>
                <p className="text-sm text-gray-600">{g.description}</p>
              </div>
              <Link
                to={`/gig/${g._id}`}
                className="text-indigo-600 hover:underline text-sm"
              >
                View Applicants
              </Link>
            </div>
          ))
        )}
      </div>

      {/* My Posts */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-indigo-600">My Posts</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500">You haven’t posted anything yet.</p>
        ) : (
          posts.map((p) => (
            <div
              key={p._id}
              className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{p.title}</p>
                <p className="text-sm text-gray-600">{p.content}</p>
              </div>
              <span className="text-xs text-gray-400">
                Likes: {p.likes?.length || 0}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
