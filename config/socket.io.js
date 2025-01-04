const { Server } = require('socket.io');

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allowed frontend origins
      credentials: true,
    },
  });

  return io;
};

module.exports = initializeSocket;
