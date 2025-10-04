// testSocket.js
const { io } = require('socket.io-client');

if (process.argv.length < 5) {
  console.error('Usage: node testSocket.js <TOKEN> <MY_ID> <PEER_ID>');
  process.exit(1);
}

const TOKEN = process.argv[2];
const MY_ID = process.argv[3];
const PEER_ID = process.argv[4];

const url = 'http://localhost:5000';
const socket = io(url, {
  auth: { token: TOKEN },
});

socket.on('connect', () => {
  console.log('✅ Connected as socket id:', socket.id);
  console.log('👤 You are user:', MY_ID);

  const payload = { receiver: PEER_ID, content: `Hi from ${MY_ID} 💬` };
  console.log('📤 Sending message:', payload);
  socket.emit('sendMessage', payload);
});

socket.on('newMessage', (msg) => {
  console.log('💌 Received newMessage:', msg);
});

socket.on('connect_error', (err) => {
  console.error('❌ connect_error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Disconnected:', reason);
});
