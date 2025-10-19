// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import { API } from "./api";
import Dashboard from "./pages/Dashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import MyApplications from "./pages/MyApplications";
import OpuslyProfile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import CreateGigPage from "./pages/CreateGigPage";
import CreateInternshipPage from "./pages/CreateInternshipPage";
import RequireAuth from "./components/RequireAuth";
import CreateRoleRedirect from "./components/CreateRoleRedirect";
import CreateSkillCard from "./pages/CreateSkillCard.jsx";


function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadError(null);
      try {
        const resUser = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(resUser.data.user);
        // keep a runtime reference so other helpers can read user without context
        window.__APP_USER__ = resUser.data.user;
        try { localStorage.setItem("user", JSON.stringify(resUser.data.user)); } catch (e) {}
      } catch (err) {
        console.error("Error loading user:", err);
        setUser(null);
        setLoadError(err?.message || String(err));
      }

      try {
        const res2 = await API.get("/messages/recent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload2 = res2?.data;
        const recent = Array.isArray(payload2)
          ? payload2
          : payload2?.messages ?? payload2?.chats ?? payload2?.data ?? [];
        setChats(recent);
      } catch (err) {
        console.warn("messages/recent failed, using demo chats", err?.message || err);
        setChats([
          { id: "1", name: "Asha", last: "Hey! Need a React dev?" },
          { id: "2", name: "Ravi", last: "Let’s connect for design" },
        ]);
      }
    })();
  }, [token]);

  const handleOpenChat = ({ id, name }) => {
    if (!id) return console.warn("handleOpenChat: missing id", { id, name });
    setSelectedChat({ id: String(id), name: name ?? String(id) });
  };

  const handleAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setChats([]);
    setSelectedChat(null);
  };

  // show auth screen if not logged in
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Auth onAuth={handleAuth} />
      </div>
    );
  }

  // show loading while fetching user
  if (!user && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading user data...
      </div>
    );
  }

  // show friendly fallback if user fetch failed
  if (loadError && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div style={{ width: "100%", maxWidth: 720 }}>
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-700">Failed to load user. Try logging out and logging in again.</p>
            <div className="mt-4">
              <button onClick={logout} className="bg-indigo-600 text-white px-3 py-2 rounded">Logout</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // normal app
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Sidebar user={user} logout={logout} />

      <div className="flex-1 ml-16 flex">
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Opusly</h1>
            {user && (
              <p className="text-gray-500 text-sm">
                Logged in as{" "}
                <span className="font-medium text-indigo-600">{user.name}</span>{" "}
                ({user.role})
              </p>
            )}
          </header>

          {selectedChat && (
            <div className="mx-8 mt-6 px-4 py-3 rounded-lg bg-pink-50 border border-pink-200 text-pink-700">
              <strong>Debug Chat Open:</strong> Chatting with{" "}
              <span className="font-semibold">{selectedChat.name}</span> (id:{" "}
              {selectedChat.id})
            </div>
          )}

          <main className="p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard onOpenChat={handleOpenChat} />} />
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/profile" element={<OpuslyProfile />} />
              <Route path="/profile/:id" element={<OpuslyProfile />} />
              <Route path="/applications" element={<MyApplications />} />
              <Route path="/create/skillcard" element={<RequireAuth><CreateSkillCard /></RequireAuth>} />
              <Route path="/create" element={<RequireAuth><CreateRoleRedirect /></RequireAuth>} />
              <Route path="/create/gig" element={<RequireAuth><CreateGigPage /></RequireAuth>} />
              <Route path="/create/internship" element={<RequireAuth requiredRole="provider"><CreateInternshipPage /></RequireAuth>} />
              <Route path="/create/post" element={<CreatePost />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        <aside className="w-80 border-l border-gray-300 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-indigo-600">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="p-3 text-gray-500">No recent messages</p>
            ) : (
              chats.map((c, idx) => {
                const chatId = String(c.id ?? c._id ?? idx);
                const chatName = c.name ?? c.fromName ?? chatId;
                const isActive = selectedChat?.id === chatId;
                return (
                  <div
                    key={chatId}
                    onClick={() => setSelectedChat({ id: chatId, name: chatName })}
                    className={`p-3 cursor-pointer hover:bg-indigo-50 transition ${isActive ? "bg-indigo-100" : ""}`}
                  >
                    <p className="font-medium">{chatName}</p>
                    <p className="text-gray-500 text-sm truncate">{c.last ?? c.content ?? ""}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            {selectedChat ? (
              <div>
                <p className="text-sm text-gray-600 mb-1">Chatting with <span className="font-semibold text-indigo-600">{selectedChat.name}</span></p>
                <div className="flex">
                  <input type="text" placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-l-md p-2 text-sm focus:outline-none" />
                  <button className="bg-indigo-600 text-white px-4 rounded-r-md text-sm hover:bg-indigo-700">Send</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">Select a chat to start messaging</p>
            )}
          </div>
        </aside>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
