import React, { useState } from "react";
import API from "../api";

export default function Auth({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    educationPast: "",
    educationCurrent: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const route = isSignup ? "/auth/signup" : "/auth/login";
      const res = await API.post(route, form);
      const token = res.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        onAuth(token);
      } else {
        alert(res.data?.message || "Authentication failed");
      }
    } catch (err) {
      console.error(err);

      if (err.response) {
        const { status, data } = err.response;

        if (status === 409) {
          alert("Email already exists. Please log in instead.");
        } else if (status === 400) {
          alert(data?.message || "Invalid input. Please check your details.");
        } else if (status === 401) {
          alert("Invalid credentials. Please try again.");
        } else {
          alert(data?.message || "Something went wrong. Try again later.");
        }
      } else {
        alert("Network error. Please check your internet connection.");
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center text-indigo-600 mb-6">
        {isSignup ? "Create your Opusly account" : "Welcome back!"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {isSignup && (
          <>
            <input
              type="text"
              name="educationPast"
              placeholder="Previous Education"
              value={form.educationPast}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <input
              type="text"
              name="educationCurrent"
              placeholder="Current Education"
              value={form.educationCurrent}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="student">Student</option>
              <option value="provider">Provider</option>
            </select>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
        >
          {isSignup ? "Sign Up" : "Log In"}
        </button>
      </form>

      <div className="text-center mt-5">
        <p className="text-sm text-gray-500">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>

      {!isSignup && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Boost your popularity score by connecting with others 
          </p>
          <button
            onClick={() => alert("Redirecting to your chat...")}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm shadow"
          >
            Go to Messages
          </button>
        </div>
      )}
    </div>
  );
}
