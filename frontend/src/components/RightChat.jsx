import React from "react";

export default function RightChat() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-indigo-600">Messages</h2>
        <button className="text-sm text-gray-500 hover:text-indigo-600">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-lg shadow-inner">
        <p className="text-gray-500 text-sm italic">
          Welcome to Opusly Chat 💬
        </p>
      </div>

      <div className="mt-4 flex">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border border-slate-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button className="px-4 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition">
          Send
        </button>
      </div>
    </div>
  );
}
