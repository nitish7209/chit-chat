require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const winston = require('winston');
const cookieParser = require('cookie-parser');
const initializeSocket = require('./config/socket.io');
const socketIoMiddleware = require('./middleware/socketIoMiddleware');
require('events').EventEmitter.defaultMaxListeners = 15;

const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/messagerouter');
const http = require('http');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app); // HTTP server for Socket.IO
const io = initializeSocket(server);

// Attach Socket.IO to all requests
app.use(socketIoMiddleware(io));




const db = require('./db/mongoose');
const morgan = require('morgan');
const logger = require('./config/logger');



app.use(morgan('combined', { stream: logger.stream }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],  // your Next.js frontend URL
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())


// Allow CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}));

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use('/users', userRoutes);
app.use('/chats', chatRoutes);

app.use(errorHandler);


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('sendMessage', (data) => {
    console.log('Received message:', data.message);  
    socket.emit('receiveMessage', { message: `Server received: ${data.message}` });
    console.log("Message send and recive done !") 
  });

   
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});
