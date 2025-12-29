const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join hospital room
    socket.on('join:hospital', (hospitalId) => {
      socket.join(`hospital:${hospitalId}`);
      console.log(`Socket ${socket.id} joined hospital:${hospitalId}`);
    });

    // Join referral room
    socket.on('join:referral', (referralId) => {
      socket.join(`referral:${referralId}`);
      console.log(`Socket ${socket.id} joined referral:${referralId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };