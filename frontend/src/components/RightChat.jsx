import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { io } from "socket.io-client";
import { ArrowLeft } from "lucide-react";
import { jwtDecode } from "jwt-decode";

export default function RightChat({ token }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  const tokenUserId = token ? jwtDecode(token)?.id : null;

  useEffect(() => {
    if (!token || token === "undefined" || token === "null") return;
    if (socketRef.current) return;

    const s = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = s;

    loadRecentChats();

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

      if (activeChat && msg.chatId === activeChat.id) {
        const isMine = msg.fromSelf || msg.sender?._id === tokenUserId;
        const formatted = { ...msg, fromSelf: isMine };
        setMessages((prev) => [...prev, formatted]);
      }
    });

    // ✅ auto–open chat when coming from “Message” button
    const target = localStorage.getItem("chatTarget");
    if (target) {
      try {
        const parsed = JSON.parse(target);
        if (parsed && parsed._id && parsed.name) {
          setActiveChat({ id: parsed._id, name: parsed.name });

          // prefill message if it exists (gig/internship auto-text)
          const prefill = localStorage.getItem("prefillMessage");
          if (prefill) {
            setMessageText(prefill);
            localStorage.removeItem("prefillMessage");
          }

          // 🔥 instantly load their chat history
          loadChatHistory(parsed._id);
        }
      } catch (err) {
        console.warn("Failed to parse chatTarget:", err);
      }
      localStorage.removeItem("chatTarget");
    }

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token, activeChat]);

  // ✅ recent chat list
  const loadRecentChats = async () => {
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

  // ✅ load all messages for a given chat user id
  const loadChatHistory = async (userId) => {
    if (!userId) return;
    try {
      const res = await API.get(`/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.messages || [];
      setMessages(
        data.map((msg) => ({
          ...msg,
          fromSelf: msg.sender?._id === tokenUserId,
        }))
      );
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setMessages([]);
    }
  };

  // ✅ open chat manually from list
  const openChat = async (chat) => {
    setActiveChat(chat);
    await loadChatHistory(chat.id);
  };

  // ✅ send message
  const handleSend = async () => {
    if (!activeChat || !messageText.trim()) return;
    try {
      const res = await API.post(
        "/messages",
        { to: activeChat.id, text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessageText("");

      const sentMessage = {
        ...res.data.message,
        fromSelf: true,
        sender: { _id: tokenUserId },
        chatId: activeChat.id,
      };

      setMessages((prev) => [...prev, sentMessage]);

      if (socketRef.current) socketRef.current.emit("sendMessage", sentMessage);
    } catch (err) {
      console.error("Send failed:", err.response?.data || err.message);
    }
  };

return (
  <aside className="fixed top-0 right-0 h-screen w-72 bg-white border-l border-gray-200 flex flex-col z-30">
    {/* Header */}
    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
      {activeChat ? (
        <button
          onClick={() => setActiveChat(null)}
          className="text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={20} />
        </button>
      ) : null}
      <h2 className="text-lg font-semibold text-indigo-600 flex-1 text-center">
        {activeChat ? activeChat.name : "Messages"}
      </h2>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto">
      {!activeChat ? (
        chats.length === 0 ? (
          <p className="p-3 text-gray-500">No recent messages</p>
        ) : (
          chats.map((c, idx) => {
            const chatId = String(c.id ?? c._id ?? idx);
            const chatName = c.name ?? c.fromName ?? chatId;
            return (
              <div
                key={chatId}
                onClick={() => openChat({ id: chatId, name: chatName })}
                className="p-3 cursor-pointer hover:bg-indigo-50 transition border-b border-gray-100"
              >
                <p className="font-medium">{chatName}</p>
                <p className="text-gray-500 text-sm truncate">
                  {c.last ?? c.content ?? ""}
                </p>
              </div>
            );
          })
        )
      ) : (
        <div className="flex flex-col p-3 space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">
              No messages yet
            </p>
          ) : (
            messages.map((m, i) => {
              const isMine = m.sender?._id === tokenUserId;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    isMine
                      ? "ml-auto bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>

    {/* Input */}
    {activeChat && (
      <div className="p-3 border-t border-gray-200 bg-white">
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
    )}
  </aside>
);
}
