// src/pages/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import { Edit3, Trash2, Save, X, Camera, Linkedin, PlusCircle } from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";


function getRuntimeUser() {
  try {
    if (typeof window !== "undefined" && window.__APP_USER__) return window.__APP_USER__;
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export default function OpuslyProfile() {
  const fileInputRef = useRef(null);

  // user state (start null, fetch real user)
  const [user, setUser] = useState(null);
  const [editableUser, setEditableUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // offers & posts
  const [offers, setOffers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // editing state
  const [editingOffer, setEditingOffer] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  // role derived at runtime after user loads
  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();
  const isProvider = role === "provider";
  const offersKind = isProvider ? "internship" : "gig";
  const offersTitle = isProvider ? "My Internships" : "My Gigs";
  const offersEmptyText = isProvider ? "You haven't posted any internships yet." : "You haven't posted any gigs yet.";

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let me = getRuntimeUser();

        // try /auth/me if token present
        if (!me && token) {
          try {
            const resMe = await API.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
            me = resMe?.data ?? null;
            if (me) {
              window.__APP_USER__ = me;
              try { localStorage.setItem("user", JSON.stringify(me)); } catch {}
            }
          } catch (err) {
            console.warn("auth/me failed:", err?.message || err);
            me = null;
          }
        }

        if (!me) {
          setUser(null);
          setEditableUser(null);
          setOffers([]);
          setPosts([]);
          setLoading(false);
          return;
        }

        setUser(me);
        setEditableUser(me);

        const uid = me._id ?? me.id;
        const tokenHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const attempts = [
          { label: "all", fn: () => API.get("/gigs", tokenHeaders) },
          { label: "ownerQuery", fn: () => API.get("/gigs", { params: { owner: uid }, ...tokenHeaders }) },
          { label: "createdByQuery", fn: () => API.get("/gigs", { params: { createdBy: uid }, ...tokenHeaders }) },
          { label: "authorQuery", fn: () => API.get("/gigs", { params: { author: uid }, ...tokenHeaders }) },
          { label: "kindOwnerQuery", fn: () => API.get("/gigs", { params: { kind: isProvider ? "internship" : "gig", owner: uid }, ...tokenHeaders }) },
          { label: "kindQuery", fn: () => API.get("/gigs", { params: { kind: isProvider ? "internship" : "gig" }, ...tokenHeaders }) },
        ];

        const normalize = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload.data)) return payload.data;
          if (Array.isArray(payload.gigs)) return payload.gigs;
          if (Array.isArray(payload.items)) return payload.items;
          return [];
        };

        const extractOwnerId = (item) => {
          if (!item) return null;
          return (
            item.owner?._id ??
            item.owner ??
            item.author?._id ??
            item.author ??
            item.createdBy?._id ??
            item.createdBy ??
            item.user ??
            item.userId ??
            null
          );
        };

        let foundOffers = [];

        for (const a of attempts) {
          try {
            const res = await a.fn();
            const arr = normalize(res?.data ?? res);
            if (!arr.length) continue;

            const filtered = arr.filter((g) => {
              const ownerId = extractOwnerId(g);
              const sameOwner = uid ? String(ownerId) === String(uid) : true;
              const kindMatch = isProvider ? (g.kind === "internship") : (g.kind === "gig" || !g.kind);
              return sameOwner && kindMatch;
            });

            if (filtered.length) {
              foundOffers = filtered;
              break;
            }
          } catch (err) {
            console.warn(`[Profile] attempt "${a.label}" failed:`, err?.message || err);
          }
        }

        if (!foundOffers.length) {
          try {
            const resAll = await API.get("/gigs", tokenHeaders);
            const arrAll = normalize(resAll?.data ?? resAll);
            const fallback = arrAll.filter((it) => {
              const ownerId = extractOwnerId(it);
              if (uid && ownerId && String(ownerId) === String(uid)) return true;
              try {
                const text = JSON.stringify(it).toLowerCase();
                if (me.email && text.includes(String(me.email).toLowerCase())) return true;
                if (me.name && text.includes(String(me.name).toLowerCase())) return true;
              } catch {}
              if (isProvider && it.kind === "internship") return true;
              if (!isProvider && (it.kind === "gig" || !it.kind)) return true;
              return false;
            });
            foundOffers = fallback;
          } catch (err) {
            console.warn("[Profile] final fallback failed:", err?.message || err);
            foundOffers = [];
          }
        }

        setOffers(foundOffers || []);

        try {
          const postsRes = await API.get("/posts", tokenHeaders);
          const postsArr = Array.isArray(postsRes?.data) ? postsRes.data : Array.isArray(postsRes?.data?.data) ? postsRes.data.data : [];
          const myPosts = postsArr.filter((p) => {
            const ownerId =
              p.owner?._id ??
              p.owner ??
              p.author?._id ??
              p.author ??
              p.user ??
              p.userId ??
              null;
            return uid ? String(ownerId) === String(uid) : true;
          });
          setPosts(myPosts);
        } catch (err) {
          console.warn("posts fetch failed:", err?.message || err);
          setPosts([]);
        }
      } catch (err) {
        console.error("Profile load failed:", err);
        toast.error("Failed to load profile data");
        setOffers([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);
  const handleChange = (field, value) => setEditableUser((s) => ({ ...s, [field]: value }));
  const toggleEdit = () => {
    setEditMode((s) => !s);
    if (!editMode) setEditableUser(user);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditableUser((s) => ({ ...s, profilePic: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleEducationChange = (index, field, value) => {
    const next = [...(editableUser?.education || [])];
    next[index] = { ...next[index], [field]: value };
    if (field === "pursuing" && value === true) next[index].to = "";
    setEditableUser((s) => ({ ...s, education: next }));
  };
  const addEducation = () => setEditableUser((s) => ({ ...s, education: [...(s?.education || []), { institution: "", degree: "", from: "", to: "", pursuing: false }] }));
  const removeEducation = (index) => setEditableUser((s) => ({ ...s, education: s?.education?.filter((_, i) => i !== index) || [] }));

  const handleSkillChange = (index, value) => setEditableUser((s) => ({ ...s, skills: (s?.skills || []).map((sk, i) => (i === index ? value : sk)) }));
  const addSkill = () => setEditableUser((s) => ({ ...s, skills: [...(s?.skills || []), ""] }));
  const removeSkill = (index) => setEditableUser((s) => ({ ...s, skills: (s?.skills || []).filter((_, i) => i !== index) }));

const handleSaveProfile = async () => {
  try {
    const token = localStorage.getItem("token");

    const payload = {
      name: editableUser.name,
      bio: editableUser.bio,
      linkedin: editableUser.linkedin,
      profilePic: editableUser.profilePic,
      education: (editableUser.education || []).map((edu) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        from: edu.from || "",
        to: edu.pursuing ? "" : edu.to || "",
        pursuing: !!edu.pursuing,
      })),
      skills: editableUser.skills || [],
    };

    const res = await API.put("/auth/me", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data?.success) {
      const updated = res.data.user;
      setUser(updated);
      setEditableUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Profile saved successfully!");
    } else {
      toast.error("Failed to save profile");
    }
  } catch (err) {
    console.error("Profile save failed:", err);
    toast.error("Couldn't save profile");
  } finally {
    setEditMode(false);
  }
};


  const handleDeleteOffer = async (offer) => {
    const id = offer._id ?? offer.id;
    if (!window.confirm("Are you sure? This will permanently delete the offer.")) return;
    const isBackend = typeof id === "string" || (typeof id === "number" && String(id).length > 8);
    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        await API.delete(`/gigs/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setOffers((prev) => prev.filter((o) => (o._id ?? o.id) !== id));
        toast.success("Offer deleted");
      } catch (err) {
        console.error("Delete offer failed", err);
        toast.error("Delete failed");
      }
    } else {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      toast.success("Offer removed (local)");
    }
  };

  const startEditOffer = (o) => setEditingOffer({ ...o });
  const cancelEditOffer = () => setEditingOffer(null);
  const saveEditedOffer = async () => {
    if (!editingOffer) return;
    const id = editingOffer._id ?? editingOffer.id;
    const isBackend = typeof id === "string" || (typeof id === "number" && String(id).length > 8);
    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        await API.put(`/gigs/${id}`, editingOffer, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setOffers((prev) => prev.map((o) => ((o._id ?? o.id) === id ? editingOffer : o)));
        toast.success("Offer updated");
        setEditingOffer(null);
      } catch (err) {
        console.error("Save offer failed", err);
        toast.error("Save failed");
      }
    } else {
      setOffers((prev) => prev.map((o) => (o.id === id ? editingOffer : o)));
      toast.success("Offer updated (local)");
      setEditingOffer(null);
    }
  };

  // Posts delete & edit
  const handleDeletePost = async (post) => {
    const id = post._id ?? post.id;
    if (!window.confirm("Delete this post?")) return;
    const isBackend = typeof id === "string" || (typeof id === "number" && String(id).length > 8);
    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        await API.delete(`/posts/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setPosts((p) => p.filter((x) => (x._id ?? x.id) !== id));
        toast.success("Post deleted");
      } catch (err) {
        console.error("Delete post failed", err);
        toast.error("Delete failed");
      }
    } else {
      setPosts((p) => p.filter((x) => x.id !== id));
      toast.success("Post removed (local)");
    }
  };

  const startEditPost = (p) => setEditingPost({ ...p });
  const cancelEditPost = () => setEditingPost(null);
  const saveEditedPost = async () => {
    if (!editingPost) return;
    const id = editingPost._id ?? editingPost.id;
    const isBackend = typeof id === "string" || (typeof id === "number" && String(id).length > 8);
    if (isBackend) {
      try {
        const token = localStorage.getItem("token");
        await API.put(`/posts/${id}`, editingPost, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setPosts((prev) => prev.map((p) => ((p._id ?? p.id) === id ? editingPost : p)));
        toast.success("Post updated");
        setEditingPost(null);
      } catch (err) {
        console.error("Save post failed", err);
        toast.error("Save failed");
      }
    } else {
      setPosts((prev) => prev.map((p) => (p.id === id ? editingPost : p)));
      toast.success("Post updated (local)");
      setEditingPost(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-2xl shadow w-full max-w-4xl text-center">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-2xl shadow w-full max-w-3xl text-center">
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">You're not signed in</h3>
          <p className="text-gray-600">Please log in to view and manage your gigs or internships.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* LEFT / MAIN */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow">
            <div className="flex items-start gap-6">
              <div className="relative">
                <img src={editableUser?.profilePic} alt="avatar" className="w-28 h-28 rounded-full object-cover border-4 border-indigo-50" />
                {editMode && (
                  <>
                    <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full" onClick={() => fileInputRef.current?.click()}>
                      <Camera size={14} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                  </>
                )}
              </div>

              <div className="flex-1">
                {editMode ? (
                  <input value={editableUser?.name || ""} onChange={(e) => handleChange("name", e.target.value)} className="text-2xl font-semibold w-full border-b focus:outline-none" />
                ) : (
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                )}
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-indigo-600 font-medium capitalize">{user.role}</p>
                <p className="text-xs text-gray-600 mt-2">Popularity: <span className="font-semibold text-indigo-500">{user.popularityScore ?? 0}</span></p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {editMode ? (
                  <>
                    <button onClick={handleSaveProfile} className="bg-indigo-600 text-white px-3 py-1.5 rounded flex items-center gap-2"><Save size={14} /> Save</button>
                    <button onClick={toggleEdit} className="px-3 py-1.5 bg-gray-200 rounded flex items-center gap-2"><X size={14} /> Cancel</button>
                  </>
                ) : (
                  <button onClick={toggleEdit} className="bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-2"><Edit3 size={14} /> Edit</button>
                )}
              </div>
            </div>

            {/* Education & Bio */}
            <div className="mt-6">
              <h4 className="text-indigo-600 font-semibold mb-2">Education</h4>
              {editMode ? (
                <div className="space-y-3">
                  {(editableUser?.education || []).map((edu, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-gray-50 relative">
                      <input value={edu.institution} onChange={(e) => handleEducationChange(i, "institution", e.target.value)} className="w-full border-b mb-2 p-1 focus:outline-none" placeholder="Institution" />
                      <input value={edu.degree} onChange={(e) => handleEducationChange(i, "degree", e.target.value)} className="w-full border-b mb-2 p-1 focus:outline-none" placeholder="Degree" />
                      <div className="flex items-center gap-2">
                        <input value={edu.from} onChange={(e) => handleEducationChange(i, "from", e.target.value)} className="w-1/3 border-b p-1 focus:outline-none" placeholder="From" />
                        {!edu.pursuing && <input value={edu.to} onChange={(e) => handleEducationChange(i, "to", e.target.value)} className="w-1/3 border-b p-1 focus:outline-none" placeholder="To" />}
                        <label className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={!!edu.pursuing} onChange={(e) => handleEducationChange(i, "pursuing", e.target.checked)} />
                          Pursuing
                        </label>
                      </div>
                      <button onClick={() => removeEducation(i)} className="absolute top-2 right-2 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={addEducation} className="mt-2 text-indigo-600 flex items-center gap-1"><PlusCircle size={14} /> Add education</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(user.education || []).map((edu, i) => (
                    <div key={i} className="p-2 border rounded-lg bg-gray-50">
                      <div className="font-medium">{edu.institution}</div>
                      <div className="text-sm text-gray-600">{edu.degree}</div>
                      <div className="text-xs text-gray-500">{edu.from} – {edu.pursuing ? "Pursuing" : edu.to}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-indigo-600 font-semibold mb-2">Bio</h4>
              {editMode ? (
                <textarea value={editableUser?.bio || ""} onChange={(e) => handleChange("bio", e.target.value)} className="w-full p-2 border rounded-md focus:outline-none" rows={3} />
              ) : (
                <p className="text-gray-700 italic">{user.bio}</p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Linkedin size={16} className="text-indigo-600" />
              {editMode ? (
                <input value={editableUser?.linkedin || ""} onChange={(e) => handleChange("linkedin", e.target.value)} className="border-b focus:outline-none" placeholder="LinkedIn URL" />
              ) : (
                user.linkedin ? <a href={user.linkedin} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">LinkedIn</a> : <span className="text-sm text-gray-500">No LinkedIn</span>
              )}
            </div>
          </div>

          {/* RIGHT / Skills */}
          <div className="bg-white rounded-2xl p-6 shadow h-[78vh] overflow-auto">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3">My Skills</h3>
            {editMode ? (
              <div className="space-y-2">
                {(editableUser?.skills || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={s} onChange={(e) => handleSkillChange(i, e.target.value)} className="flex-1 border-b focus:outline-none p-1" />
                    <button onClick={() => removeSkill(i)} className="text-red-500">✕</button>
                  </div>
                ))}
                <button onClick={addSkill} className="mt-2 text-indigo-600 flex items-center gap-1"><PlusCircle size={14} /> Add skill</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(user.skills || []).map((s, i) => <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs">{s}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* OFFERS (Gigs / Internships) */}
        <div className="bg-white rounded-2xl p-6 mt-8 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-indigo-600">{offersTitle}</h3>
            <div className="text-sm text-gray-500">{offers.length} items</div>
          </div>

          {offers.length === 0 ? (
            <div className="text-gray-500 py-6">{offersEmptyText}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {offers.map((o) => {
                const id = o._id ?? o.id;
                const priceLabel = o.stipend ?? o.price ?? "—";
                const timeLabel = o.durationWeeks ?? o.deliveryTime ?? o.delivery ?? "—";
                return (
                  <div key={id} className="border rounded-xl p-4 bg-gray-50">
                    {editingOffer && ((editingOffer._id ?? editingOffer.id) === id) ? (
                      <>
                        <input value={editingOffer.title} onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })} className="w-full border-b mb-2 p-1" />
                        <textarea value={editingOffer.description} onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })} className="w-full border rounded p-1 mb-2" rows={3} />
                        <div className="flex gap-2">
                          <button onClick={saveEditedOffer} className="bg-indigo-600 text-white px-3 py-1 rounded">Save</button>
                          <button onClick={cancelEditOffer} className="px-3 py-1 border rounded">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-indigo-700 font-semibold">{o.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{o.description}</p>
                            <p className="text-xs text-gray-500 mt-2">₹{priceLabel} • {timeLabel}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400 uppercase">{(o.kind || offersKind).slice(0, 12)}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-3">
                          <button onClick={() => startEditOffer(o)} className="text-indigo-500 text-sm"><Edit3 size={14} /> Edit</button>
                          <button onClick={() => handleDeleteOffer(o)} className="text-red-500 text-sm"><Trash2 size={14} /> Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* POSTS */}
        <div className="bg-white rounded-2xl p-6 mt-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-indigo-600">My Posts</h3>
            <div className="text-sm text-gray-500">{posts.length} posts</div>
          </div>

          {posts.length === 0 ? (
            <div className="text-gray-500 py-6">No posts yet.</div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => {
                const pid = p._id ?? p.id;
                return (
                  <div key={pid} className="border rounded-xl p-4 bg-gray-50">
                    {editingPost && ((editingPost._id ?? editingPost.id) === pid) ? (
                      <>
                        <input value={editingPost.title} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} className="w-full border-b mb-2 p-1" />
                        <textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} className="w-full border rounded p-1" rows={3} />
                        <div className="mt-2 flex gap-2">
                          <button onClick={saveEditedPost} className="bg-indigo-600 text-white px-3 py-1 rounded">Save</button>
                          <button onClick={cancelEditPost} className="px-3 py-1 border rounded">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-indigo-700 font-semibold">{p.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{p.content}</p>
                        <div className="mt-2 flex gap-3">
                          <button onClick={() => startEditPost(p)} className="text-indigo-500 text-sm"><Edit3 size={14} /> Edit</button>
                          <button onClick={() => handleDeletePost(p)} className="text-red-500 text-sm"><Trash2 size={14} /> Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
