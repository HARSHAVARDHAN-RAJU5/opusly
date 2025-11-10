// src/components/ChatOverlay.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { API } from "../api";

export default function ChatOverlay({ isOpen, onClose, userId }) {
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  // Connect to socket
  useEffect(() => {
    if (!isOpen) return;

    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000", {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log(" Socket connected");
      if (userId) socketRef.current.emit("joinChat", userId);
    });

    socketRef.current.on("newMessage", (msg) => {
      if (
        (msg.sender === userId && msg.receiver === socketRef.current.userId) ||
        (msg.receiver === userId && msg.sender === socketRef.current.userId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socketRef.current.on("userTyping", (fromId) => {
      if (fromId === userId) {
        setTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTyping(false), 2000);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [isOpen, userId, token]);

  useEffect(() => {
    if (isOpen && userId) {
      (async () => {
        try {
          const [userRes, historyRes] = await Promise.all([
            API.get(`/auth/user/${userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            API.get(`/messages/${userId}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setChatUser(userRes.data.user);
          setMessages(historyRes.data.messages || []);
        } catch (err) {
          console.error("Failed to load chat data:", err);
        }
      })();
    }
  }, [isOpen, userId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg = { sender: "me", text };

    setMessages((prev) => [...prev, newMsg]);
    socketRef.current.emit("sendMessage", {
      receiver: userId,
      content: text,
    });

    setText("");
  };

  const handleTyping = () => {
    socketRef.current.emit("typing", userId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col z-50 border-l"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h3 className="font-semibold text-indigo-600">
                {chatUser ? chatUser.name : "Loading..."}
              </h3>
              <p className="text-xs text-gray-400">Chat active</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition text-sm"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-4">
                Say hi.. to start chatting!
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.sender === "me" || msg.sender === chatUser?._id
                      ? msg.sender === "me"
                        ? "ml-auto bg-indigo-600 text-white"
                        : "bg-white border text-gray-700"
                      : "bg-white border text-gray-700"
                  }`}
                >
                  {msg.content || msg.text}
                </div>
              ))
            )}

            {typing && (
              <p className="text-xs text-gray-400 italic px-2">
                {chatUser?.name?.split(" ")[0]} is typing…
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTyping}
              placeholder="Type a message..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Send
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
