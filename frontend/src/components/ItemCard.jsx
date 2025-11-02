// ItemCard.jsx
import React from "react";

const typesConfig = {
  internship: { label: "Internship", badge: "Internship", showApply: true },
  gig: { label: "Gig", badge: "Gig", showApply: true },
  post: { label: "Post", badge: "Post", showApply: false },
};

export default function ItemCard({ item, onMessage, onApply }) {
  const type = (item.type || "post").toLowerCase();
  const cfg = typesConfig[type] || typesConfig.post;

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {cfg.label} — {item.title}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border text-gray-600">
              {cfg.badge}
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            By {item.providerName || "Unknown"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            onClick={() => onMessage && onMessage(item)}
            className="text-sm"
          >
            Message
          </button>

          {cfg.showApply ? (
            <button
              onClick={() => onApply && onApply(item)}
              className="px-3 py-1 rounded-md bg-violet-600 text-white text-sm shadow"
            >
              Apply
            </button>
          ) : (
            <div className="text-sm text-gray-400">—</div>
          )}
        </div>
      </div>
    </div>
  );
}
