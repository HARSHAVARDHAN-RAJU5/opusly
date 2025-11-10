import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";

export default function Messages() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const toUserId = params.get("to");
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (toUserId) {
      (async () => {
        try {
          const res = await API.get(`/auth/user/${toUserId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setChatUser(res.data.user);
        } catch (err) {
          console.error("Failed to load chat user:", err);
        }
      })();
    }
  }, [toUserId]);

  const handleSend = async () => {
    console.log("Send button clicked");
    console.log("toUserId:", toUserId, "text:", text);

    if (!text.trim()) {
      console.log("Empty message, not sending");
      return;
    }

    try {
      const res = await API.post(
        "/messages",
        { to: toUserId, text },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("Response from backend:", res.data);
      setMessages((prev) => [...prev, res.data.message]);
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err.response?.data || err.message);
    }
  };


  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <div className="w-1/3 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-indigo-600 mb-4">
          Messages
        </h2>
        <p className="text-sm text-gray-500">
          {chatUser
            ? `Chatting with ${chatUser.name}`
            : "Select a user to start chatting"}
        </p>
      </div>

      {/* Chat box */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No messages yet. Start a conversation 
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.sender === "me"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border"
                }`}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t bg-white flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => {
              console.log("Send button clicked");
              handleSend();
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
