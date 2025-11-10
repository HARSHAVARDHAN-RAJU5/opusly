// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import API from "./api";
import Dashboard from "./pages/Dashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import MyApplications from "./pages/MyApplications";
import OpuslyProfile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import CreateGigPage from "./pages/CreateGigPages.jsx";
import CreateInternshipPage from "./pages/CreateInternshipPage";
import RequireAuth from "./components/RequireAuth";
import CreateRoleRedirect from "./components/CreateRoleRedirect";
import CreateSkillCard from "./pages/CreateSkillCard.jsx";
import ProviderApplicants from "./pages/ProviderApplicants";
import RightChat from "./components/RightChat";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loadError, setLoadError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const resUser = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(resUser.data.user);
        localStorage.setItem("user", JSON.stringify(resUser.data.user));
      } catch (err) {
        console.error("Error loading user:", err);
        setUser(null);
        setLoadError(err?.message || String(err));
      }
    })();
  }, [token]);

  const handleAuth = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setSelectedChat(null);
  };

  const handleOpenChat = ({ id, name }) => {
    setSelectedChat({ id, name });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Auth onAuth={handleAuth} />
      </div>
    );
  }

  if (!user && !loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading user data...
      </div>
    );
  }

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

          <main className="p-8 overflow-y-auto">
            <Routes>
              <Route
                path="/"
                element={<Dashboard onOpenChat={handleOpenChat} user={user} />}
              />
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/profile" element={<OpuslyProfile />} />
              <Route path="/profile/:id" element={<OpuslyProfile />} />
              <Route path="/applications" element={<MyApplications />} />
              <Route
                path="/create/skillcard"
                element={
                  <RequireAuth>
                    <CreateSkillCard />
                  </RequireAuth>
                }
              />
              <Route
                path="/create"
                element={
                  <RequireAuth>
                    <CreateRoleRedirect />
                  </RequireAuth>
                }
              />
              <Route
                path="/create/gig"
                element={
                  <RequireAuth>
                    <CreateGigPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/create/internship"
                element={
                  <RequireAuth requiredRole="provider">
                    <CreateInternshipPage />
                  </RequireAuth>
                }
              />
              <Route path="/create/post" element={<CreatePost />} />
              <Route
                path="/provider-applicants"
                element={<ProviderApplicants />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* ✅ clean sidebar moved to RightChat */}
        <RightChat
          token={token}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
        />
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
