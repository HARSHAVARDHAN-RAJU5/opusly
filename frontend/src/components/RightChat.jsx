import React, { useEffect, useState } from "react";
import API from "../api";
import { io } from "socket.io-client";

export default function RightChat({ token, selectedChat, setSelectedChat }) {
  const [chats, setChats] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const s = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });
    setSocket(s);

    loadRecentMessages();

    s.on("newMessage", (msg) => {
      console.log("New message received:", msg);
      setChats((prev) => {

        const exists = prev.find((c) => c.id === msg.chatId);
        if (exists) {
          return prev.map((c) =>
            c.id === msg.chatId ? { ...c, last: msg.text } : c
          );
        }
        return [{ id: msg.chatId, name: msg.fromName, last: msg.text }, ...prev];
      });
    });

    return () => {
      s.disconnect();
    };
  }, [token]);

  const loadRecentMessages = async () => {
    try {
      const res = await API.get("/messages/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res?.data;
      const recent = Array.isArray(payload)
        ? payload
        : payload?.messages ?? payload?.chats ?? payload?.data ?? [];
      setChats(recent);
    } catch (err) {
      console.warn("Failed to load recent messages:", err);
      setChats([]);
    }
  };

  const handleSend = async () => {
    if (!selectedChat || !messageText.trim()) return;
    try {
      const res = await API.post(
        "/messages",
        { to: selectedChat.id, text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessageText("");

      // Emit event to backend socket for realtime sync
      if (socket) socket.emit("sendMessage", res.data.message);
    } catch (err) {
      console.error("Send failed:", err.response?.data || err.message);
    }
  };

  return (
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
                className={`p-3 cursor-pointer hover:bg-indigo-50 transition ${
                  isActive ? "bg-indigo-100" : ""
                }`}
              >
                <p className="font-medium">{chatName}</p>
                <p className="text-gray-500 text-sm truncate">
                  {c.last ?? c.content ?? ""}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        {selectedChat ? (
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Chatting with{" "}
              <span className="font-semibold text-indigo-600">
                {selectedChat.name}
              </span>
            </p>
            <div className="flex">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-l-md p-2 text-sm focus:outline-none"
              />
              <button
                onClick={handleSend}
                className="bg-indigo-600 text-white px-4 rounded-r-md text-sm hover:bg-indigo-700"
              >
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
  );
}
