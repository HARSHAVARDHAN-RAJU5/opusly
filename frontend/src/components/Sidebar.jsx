import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, FileText, PlusCircle, LogOut, Briefcase } from "lucide-react";

export default function Sidebar({ user, logout }) {
  const location = useLocation();

  const linkClasses = (path) =>
    `flex items-center gap-3 p-3 rounded-lg transition ${
      location.pathname === path
        ? "bg-indigo-600 text-white"
        : "text-gray-700 hover:bg-indigo-100"
    }`;

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm">
      <div>
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-indigo-600 tracking-wide">
            Opusly
          </h2>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {user?.role || "user"}
          </p>
        </div>

        <nav className="p-4 space-y-1">
          <Link to="/" className={linkClasses("/")}>
            <Home size={18} />
            <span>Dashboard</span>
          </Link>

          {user?.role === "student" && (
            <>
              <Link to="/applications" className={linkClasses("/applications")}>
                <FileText size={18} />
                <span>My Applications</span>
              </Link>

              <Link to="/profile" className={linkClasses("/profile")}>
                <User size={18} />
                <span>Profile</span>
              </Link>
            </>
          )}

          {user?.role === "provider" && (
            <>
              <Link to="/create-gig" className={linkClasses("/create-gig")}>
                <Briefcase size={18} />
                <span>Create Gig</span>
              </Link>

              <Link to="/create-post" className={linkClasses("/create-post")}>
                <PlusCircle size={18} />
                <span>Create Post</span>
              </Link>

              <Link to="/profile" className={linkClasses("/profile")}>
                <User size={18} />
                <span>Profile</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
