import React, { useEffect, useState } from "react";
import { API } from "../api";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProfile(res.data?.user ?? {});
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    })();
  }, []);

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white shadow rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-indigo-600 mb-2">
            {profile.name}
          </h2>
          <p className="text-gray-600 text-sm mb-1">
            <strong>Email:</strong> {profile.email}
          </p>
          <p className="text-gray-600 text-sm mb-1 capitalize">
            <strong>Role:</strong> {profile.role}
          </p>
          {profile.educationPast && (
            <p className="text-gray-600 text-sm mb-1">
              <strong>Past Education:</strong> {profile.educationPast}
            </p>
          )}
          {profile.educationCurrent && (
            <p className="text-gray-600 text-sm mb-1">
              <strong>Current Education:</strong> {profile.educationCurrent}
            </p>
          )}
          <p className="text-gray-600 text-sm">
            <strong>Popularity Score:</strong>{" "}
            <span className="text-indigo-600 font-semibold">
              {profile.popularityScore ?? 0}
            </span>
          </p>
        </div>

        <button
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow"
        >
          Message 💬
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold text-indigo-600 mb-3">
          My Skills
        </h3>
        {profile.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s, idx) => (
              <span
                key={idx}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No skills added yet.</p>
        )}
      </div>
    </div>
  );
}
