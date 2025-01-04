const { io } = require('socket.io-client'); // Import the Socket.IO client
const socket = io('http://localhost:3000'); // Ensure this matches your server's URL

// Listen for the connection event
socket.on('connect', () => {
    console.log('Connected to the server');
});

// Listen for any messages from the server
socket.on('message', (data) => {
    console.log('Message from server:', data);
});

// Handle connection errors
socket.on('connect_error', (err) => {
    console.error('Connection Error:', err);
});

// Optionally, you can emit an event to the server
socket.emit('testEvent', { message: 'Hello from client!' }); 