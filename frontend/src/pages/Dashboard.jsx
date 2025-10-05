import React, { useEffect, useState } from "react";
import { API } from "../api";

export default function Dashboard() {
  const [gigs, setGigs] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [gigsRes, skillsRes] = await Promise.all([
          API.get("/gigs"),
          API.get("/skills", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);
        setGigs(gigsRes.data?.gigs ?? []);
        setSkills(skillsRes.data?.skills ?? []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    })();
  }, []);

  const handleApply = async (gigId) => {
    try {
      const res = await fetch(`${API}/api/gigs/apply/${gigId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        alert("Applied successfully with your SkillCard! 🎉");
      } else {
        alert(data.message || "You may have already applied.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while applying.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">
        Student Dashboard
      </h1>

      {/* SkillCard Section */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-indigo-600">My SkillCard</h2>
        {skills.length === 0 ? (
          <p className="text-gray-500 text-sm">You haven’t added any skills yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s._id}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gigs Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-indigo-600">
          Available Gigs & Internships
        </h2>
        {gigs.length === 0 ? (
          <p className="text-gray-500">No gigs available right now.</p>
        ) : (
          gigs.map((g) => (
            <div
              key={g._id}
              className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{g.title}</p>
                <p className="text-sm text-gray-600">{g.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Posted by {g.provider?.name || "Unknown"}
                </p>
              </div>
              <button
                onClick={() => handleApply(g._id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
              >
                Apply with SkillCard
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
