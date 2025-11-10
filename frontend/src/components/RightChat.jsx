import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import { io } from "socket.io-client";
import { ArrowLeft } from "lucide-react";
import { jwtDecode } from "jwt-decode";



export default function RightChat({ token }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // active chat
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]); // store chat messages
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

      // If current active chat, also append message
      if (activeChat && msg.chatId === activeChat.id) {
        const isMine =
          msg.fromSelf || msg.sender?._id === tokenUserId; // handles both local + server
        const formatted = { ...msg, fromSelf: isMine };
        setMessages((prev) => [...prev, formatted]);
      }

    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token, activeChat]);

  // Fetch chat list
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

  // Fetch messages for selected chat
  const openChat = async (chat) => {
    setActiveChat(chat);
    try {
      const res = await API.get(`/messages/${chat.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Chat response:", res.data);
      const msgs = res.data?.messages || [];
        setMessages(msgs);

    } catch (err) {
      console.warn("Failed to load chat messages:", err);
      setMessages([]);
    }
  };

  // Send message
const handleSend = async () => {
  if (!activeChat || !messageText.trim()) return;
  try {
    const res = await API.post(
      "/messages",
      { to: activeChat.id, text: messageText },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMessageText("");

    // tag the outgoing message
    const sentMessage = {
      ...res.data.message,
      fromSelf: true,
      sender: { _id: tokenUserId }, // stamp your id so socket can recognise it
      chatId: activeChat.id,
    };

    // update UI immediately
    setMessages((prev) => [...prev, sentMessage]);

    // send through socket
    if (socketRef.current) socketRef.current.emit("sendMessage", sentMessage);
  } catch (err) {
    console.error("Send failed:", err.response?.data || err.message);
  }
};



  // View: chat list OR active chat
  return (
    <aside className="w-80 border-l border-gray-300 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center">
        {activeChat ? (
          <button
            onClick={() => setActiveChat(null)}
            className="mr-2 text-gray-500 hover:text-indigo-600"
          >
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <h2 className="text-lg font-semibold text-indigo-600">
          {activeChat ? activeChat.name : "Messages"}
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!activeChat ? (
          // Chat list
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
          // Active chat messages
          <div className="flex flex-col p-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">
                No messages yet
              </p>
            ) : (
              messages.map((m, i) => {
                const isMine = m.sender?._id === tokenUserId; // identify who sent it
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
        <div className="p-3 border-t border-gray-200">
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
