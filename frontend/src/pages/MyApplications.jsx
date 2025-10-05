import React, { useEffect, useState } from "react";
import { API } from "../api";

export default function MyApplications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/gigs/applied", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setApplications(res.data?.applications || []);
      } catch (err) {
        console.error("Failed to load applications", err);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
        My Applications
      </h2>

      {applications.length === 0 ? (
        <p className="text-gray-500">You haven’t applied to anything yet.</p>
      ) : (
        applications.map((a) => (
          <div
            key={a._id}
            className="bg-white p-4 mb-3 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">{a.gig?.title}</p>
              <p className="text-sm text-gray-600">
                {a.gig?.description?.slice(0, 100) || "No description"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Provider: {a.gig?.provider?.name || "Unknown"}
              </p>
            </div>
            <span className="text-indigo-600 text-sm font-medium">
              Interested
            </span>
          </div>
        ))
      )}
    </div>
  );
}
