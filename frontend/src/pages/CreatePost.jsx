// src/pages/CreatePost.jsx
import React, { useRef, useState } from "react";
import { API } from "../api";

export default function CreatePost() {
  const fileRef = useRef();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState([]); // { file, previewUrl }
  const [loading, setLoading] = useState(false);

  // config
  const MAX_IMAGES = 6;
  const MAX_IMAGE_MB = 5; // max per image

  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // limit number of images
    const allowedSlots = Math.max(0, MAX_IMAGES - images.length);
    const toAdd = files.slice(0, allowedSlots);

    const validated = toAdd.map((file) => {
      // simple validation
      const sizeMB = file.size / 1024 / 1024;
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        tooLarge: sizeMB > MAX_IMAGE_MB,
      };
    });

    // optionally filter out tooLarge here or still show with warning
    setImages((prev) => [...prev, ...validated]);
    // reset input so selecting same file again works
    fileRef.current.value = "";
  };

  const removeImageAt = (index) => {
    setImages((prev) => {
      // revoke objectURL to avoid memory leak
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // front-end validations
    if (!title.trim()) return alert("Please enter a title");
    if (!description.trim()) return alert("Please enter a description");
    if (images.some((img) => img.tooLarge))
      return alert(`One or more images exceed ${MAX_IMAGE_MB} MB. Remove or compress them.`);

    setLoading(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      // tags: comma-separated -> array on server
      form.append("tags", tags);

      images.forEach((imgObj, idx) => {
        // Append files as images[] to be compatible with many backends
        form.append("images", imgObj.file, imgObj.file.name || `image-${idx}.jpg`);
      });

      const token = localStorage.getItem("token");
      const res = await API.post("/posts", form, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // success
      alert("Post created successfully 💫");
      // optionally redirect or clear form
      setTitle("");
      setDescription("");
      setTags("");
      images.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
      setImages([]);
      // if you want to navigate, use react-router's useNavigate in future
    } catch (err) {
      console.error("Create post failed:", err?.response?.data || err?.message);
      alert("Failed to create post. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Short, clear title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Add details. Explain why these images are relevant."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="react, ui-design, frontend"
            />
          </div>

          {/* images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFilesSelected}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                onClick={() => fileRef.current && fileRef.current.click()}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md cursor-pointer hover:bg-indigo-100"
              >
                Add Images
              </label>

              <p className="text-xs text-gray-500">
                {images.length}/{MAX_IMAGES} images • max {MAX_IMAGE_MB}MB each
              </p>
            </div>

            {/* preview thumbnails */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.previewUrl}
                    alt={`preview-${i}`}
                    className="w-full h-28 object-cover rounded-md border"
                  />
                  {img.tooLarge && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-white">
                      Too large
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImageAt(i)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:scale-105"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Posting..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
