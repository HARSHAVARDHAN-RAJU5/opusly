const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { verifyToken } = require("../middleware/auth");

// ✅ Get recent chats for the logged-in user
router.get("/recent", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);

    // Fetch all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: user.id }, { receiver: user.id }],
    })
      .sort({ updatedAt: -1 })
      .populate("sender", "name")
      .populate("receiver", "name");

    // Group by other participant
    const chatsMap = new Map();

    messages.forEach((msg) => {
      const other =
        msg.sender._id.toString() === user.id
          ? msg.receiver
          : msg.sender;
      if (!chatsMap.has(other._id.toString())) {
        chatsMap.set(other._id.toString(), {
          id: other._id,
          name: other.name,
          last: msg.content,
          updatedAt: msg.updatedAt,
        });
      }
    });

    const chats = Array.from(chatsMap.values()).sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return res.json({ success: true, chats });
  } catch (err) {
    console.error("Error loading recent messages:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
});

// ✅ Fetch chat history between current user and another
router.get("/:userId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: user.id, receiver: otherId },
        { sender: otherId, receiver: user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name")
      .populate("receiver", "name");

    return res.json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching chat:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load chat",
    });
  }
});

module.exports = router;
