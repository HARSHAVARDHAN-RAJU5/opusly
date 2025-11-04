import React, { useEffect, useState } from "react";
import API from "../api";

export default function InternshipGigs() {
  const [gigs, setGigs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/gigs");
        setGigs(res.data?.gigs ?? []);
      } catch (err) {
        console.error(err);
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
        alert("Applied successfully! 🎉");
      } else {
        alert(data.message || "You’ve already applied, or something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to apply. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Internship Gigs</h2>
      {gigs.length === 0 ? (
        <p className="text-gray-500">No gigs available.</p>
      ) : (
        gigs.map((g) => (
          <div
            key={g._id}
            className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">{g.title}</p>
              <p className="text-sm text-gray-600">{g.description}</p>
              <p className="text-xs text-gray-400 mt-1">By {g.provider?.name || "Unknown"}</p>
            </div>
            <button
              onClick={() => handleApply(g._id)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Apply
            </button>
          </div>
        ))
      )}
    </div>
  );
}
