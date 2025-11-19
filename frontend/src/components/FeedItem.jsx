import React from "react";

export default function FeedItem({
  item,
  tokenUserId,
  user,
  isInternship,
  getFirstImageUrl,
  posterName,
  onApply,
  onMessage,
  onPopularity, // NEW — handler passed from dashboard
}) {
  const idKey = item._id ?? item.id;
  const intern = isInternship(item);
  const imageUrl = getFirstImageUrl(item);

  // ---------------------
  //   POST RENDER
  // ---------------------
  if ((item._type ?? "").toLowerCase() === "post") {
    return (
      <article
        key={idKey}
        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
      >
        <h2 className="font-semibold text-indigo-700">
          {item.title ?? "Post"}
        </h2>

        <p className="text-xs text-gray-500">Posted by {posterName(item)}</p>

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

  // ---------------------
  //  GIG / INTERNSHIP RENDER
  // ---------------------
  return (
    <article
      key={idKey}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-indigo-700">
            {item.title ?? item.name}
          </h2>
          <p className="text-xs text-gray-500">Posted by {posterName(item)}</p>
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

      {/* Description */}
      <p className="text-sm text-gray-600 mt-2">
        {item.content ?? item.description}
      </p>

      {/* Skills */}
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

      {/* Buttons */}
      <div className="mt-3 flex gap-2">
        {intern && (
          <button
            onClick={() => onApply(item)}
            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            Apply
          </button>
        )}

        <button
          onClick={() => onMessage(item)}
          className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
        >
          Message
        </button>

        {/* Only GIGS get Popularity button */}
        {!intern && (
          <button
            onClick={() => onPopularity(item)}
            className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            Popularity
          </button>
        )}
      </div>
    </article>
  );
}
