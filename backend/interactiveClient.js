// interactiveClient.js
// Usage: node interactiveClient.js "Bearer <TOKEN>" <YOUR_ID> <OTHER_ID>

const { io } = require("socket.io-client");
const readline = require("readline");

const [, , rawToken, myId, otherId] = process.argv;
if (!rawToken || !myId || !otherId) {
  console.error("Usage: node interactiveClient.js \"Bearer <TOKEN>\" <MY_ID> <OTHER_ID>");
  process.exit(1);
}
const token = rawToken.replace(/^"|"$/g, "");

const socket = io("http://127.0.0.1:5000", {
  transports: ["websocket"],
  auth: { token },
});

socket.on("connect", () => {
  console.log("✅ Connected as socket id:", socket.id);
  console.log("👤 You are user:", myId);
  console.log("Type a message and press Enter to send. Ctrl+C to quit.");
});

// receive messages
socket.on("newMessage", (msg) => {
  console.log("\n💌 Received newMessage:", msg);
  rl.prompt(true);
});

socket.on("connect_error", (err) => {
  console.error("❌ connect_error:", err.message || err);
});

// send messages typed by user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> "
});

rl.on("line", (line) => {
  const content = line.trim();
  if (!content) {
    rl.prompt();
    return;
  }
  const payload = { receiver: otherId, content };
  console.log("📤 Sending message:", payload);
  socket.emit("sendMessage", payload); // adjust if your event name differs
  rl.prompt();
});

rl.on("SIGINT", () => {
  console.log("\nbye 💜");
  socket.close();
  process.exit(0);
});

// start prompt after connect (safe delay)
setTimeout(() => rl.prompt(), 300);

