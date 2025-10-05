import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import { API } from "./api";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MyApplications from "./pages/MyApplications";
import ProviderDashboard from "./pages/ProviderDashboard";
import Profile from "./pages/Profile";
import CreateGig from "./pages/CreateGigs";
import CreatePost from "./pages/CreatePost";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const resUser = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(resUser.data.user);
      } catch (err) {
        console.error("Error loading user:", err);
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
        console.warn("messages/recent failed, using demo chats", err?.response?.data || err?.message);
        setChats([
          { id: 1, name: "Asha", last: "Hey! Need a React dev?" },
          { id: 2, name: "Ravi", last: "Let’s connect for design" },
          { id: 3, name: "Priya", last: "Can you review my portfolio?" },
        ]);
      }
    })();
  }, [token]);

  const handleAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setChats([]);
    setUser(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Auth onAuth={handleAuth} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Sidebar user={user} logout={logout} />

      {/* Main Content Area */}
      <div className="flex-1 ml-16 flex">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Opusly</h1>
            {user && (
              <p className="text-gray-500 text-sm">
                Logged in as{" "}
                <span className="font-medium text-indigo-600">{user.name}</span> (
                {user.role})
              </p>
            )}
          </header>

          {/* Routes */}
          <main className="p-8 overflow-y-auto">
            <Routes>
              {user?.role === "student" ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/applications" element={<MyApplications />} />
                  <Route path="/profile" element={<Profile />} />
                </>
              ) : user?.role === "provider" ? (
                <>
                  <Route path="/" element={<ProviderDashboard />} />
                  <Route path="/create-gig" element={<CreateGig />} />
                  <Route path="/create-post" element={<CreatePost />} />
                  <Route path="/profile" element={<Profile />} />
                </>
              ) : (
                <Route path="/" element={<Dashboard />} />
              )}
            </Routes>
          </main>
        </div>

        {/* Chat Sidebar */}
        <aside className="w-80 border-l border-gray-300 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-indigo-600">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="p-3 text-gray-500">No recent messages</p>
            ) : (
              chats.map((c, idx) => (
                <div
                  key={c.id ?? c._id ?? idx}
                  onClick={() => setSelectedChat(c.name ?? c.fromName)}
                  className={`p-3 cursor-pointer hover:bg-indigo-50 transition ${
                    selectedChat === (c.name ?? c.fromName)
                      ? "bg-indigo-100"
                      : ""
                  }`}
                >
                  <p className="font-medium">
                    {c.name ?? c.fromName ?? "Unknown"}
                  </p>
                  <p className="text-gray-500 text-sm truncate">
                    {c.last ?? c.content ?? ""}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            {selectedChat ? (
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Chatting with{" "}
                  <span className="font-semibold text-indigo-600">
                    {selectedChat}
                  </span>
                </p>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-l-md p-2 text-sm focus:outline-none"
                  />
                  <button className="bg-indigo-600 text-white px-4 rounded-r-md text-sm hover:bg-indigo-700">
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center">
                Select a chat to start messaging
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
