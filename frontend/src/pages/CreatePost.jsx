// src/pages/CreatePost.jsx
import React, { useRef, useState } from "react";
import API from "../api";
import toast from "react-hot-toast";

export default function CreatePost() {
  const fileRef = useRef();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const MAX_IMAGES = 6;
  const MAX_MB = 5;

  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const allowedSlots = Math.max(0, MAX_IMAGES - images.length);
    const toAdd = files.slice(0, allowedSlots);

    const validated = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      tooLarge: file.size / 1024 / 1024 > MAX_MB,
    }));

    setImages((prev) => [...prev, ...validated]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImageAt = (index) => {
    setImages((prev) => {
      const img = prev[index];
      if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Title is required");
    if (!content.trim()) return toast.error("Content is required");
    if (images.some((img) => img.tooLarge))
      return toast.error(`One or more images exceed ${MAX_MB} MB`);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Not logged in. Please log in again.");
        setLoading(false);
        return;
      }

      let res;

      if (images.length > 0) {
        // multipart form for images
        const form = new FormData();
        form.append("title", title.trim());
        form.append("content", content.trim());
        form.append(
          "tags",
          tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .join(",")
        );
        images.forEach((img, idx) => {
          form.append("images", img.file, img.file.name || `image-${idx}.jpg`);
        });

        res = await API.post("/posts", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // normal JSON if no images
        const payload = {
          title: title.trim(),
          content: content.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        };

        res = await API.post("/posts", payload, {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (res?.status === 201 || res?.data?.success) {
        toast.success("Post created successfully 🎉");
        setTitle("");
        setContent("");
        setTags("");
        images.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
        setImages([]);
      } else {
        toast.error(res?.data?.message || "Failed to create post");
      }
    } catch (err) {
      console.error("Create post failed:", err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">Create Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Short, clear title"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="Write your thoughts..."
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="react, ui-design, frontend"
            />
          </div>

          {/* Images */}
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
                {images.length}/{MAX_IMAGES} images • max {MAX_MB}MB each
              </p>
            </div>

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

          {/* Submit */}
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
