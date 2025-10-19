// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Briefcase, User, LogOut, PlusCircle } from "lucide-react";

export default function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  const role = (user?.role || "").toLowerCase();

  const handleLogout = () => {
    logout?.();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <Home size={16} /> },
    ...(role === "student"
      ? [{ name: "My Applications", path: "/applications", icon: <Briefcase size={16} /> }]
      : []),
    { name: "Profile", path: "/profile", icon: <User size={16} /> },
  ];

  // ------------------ CREATE SECTION ------------------
  const createItems = [];

  // every role can post
  createItems.push({ name: "Post", path: "/create/post" });

  if (role === "provider") {
    // Providers see Internship
    createItems.push({
      name: "Internship",
      path: "/create/internship",
    });
  } else if (role === "student") {
    // Students see SkillCard first and Gig second
    createItems.unshift({
      name: "SkillCard",
      path: "/create/skillcard",
    });
    createItems.push({
      name: "Gig",
      path: "/create/gig",
    });
  }

  return (
    <div className="w-40 h-screen bg-white border-r flex flex-col justify-between">
      {/* ---------- TOP SECTION ---------- */}
      <div>
        <div className="text-xl font-bold text-indigo-600 p-4 tracking-tight">
          Opusly
        </div>
        <p className="text-xs text-gray-400 px-4 mb-2 capitalize">
          {role || "guest"}
        </p>

        {/* ---------- MAIN NAVIGATION ---------- */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-indigo-50"
                }`
              }
            >
              {item.icon}
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* ---------- CREATE SECTION ---------- */}
        <div className="mt-4 px-2">
          <div className="flex items-center gap-1 text-gray-400 text-[11px] uppercase tracking-wide px-2 mb-1">
            <PlusCircle size={12} />
            <span>Create</span>
          </div>

          <div className="flex flex-col gap-1">
            {createItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `block px-3 py-1.5 text-xs rounded-md transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-indigo-50"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- LOGOUT BUTTON ---------- */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-1.5 m-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
      >
        <LogOut size={14} />
        Logout
      </button>
    </div>
  );
}
