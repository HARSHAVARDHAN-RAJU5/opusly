import React from "react";

export default function ProfileCard({ id, name = "Student", bio = "" }) {
  const openChat = () => {
    window.dispatchEvent(new CustomEvent("opusly-open-chat", { detail: { id, name } }));
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-md">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">{(name||"U").charAt(0)}</div>
        <div>
          <div className="font-bold text-lg">{name}</div>
          <div className="text-sm text-gray-600">{bio}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={openChat} className="px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">Message</button>
      </div>
    </div>
  );
}
