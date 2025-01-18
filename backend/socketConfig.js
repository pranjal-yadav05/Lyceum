import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  transports: ['websocket', 'polling'],
  withCredentials: true
});

let pingInterval = NodeJS.Timeout;

export const initializeSocket = (topicId) => {
  // Clear any existing ping interval
  if (pingInterval) {
    clearInterval(pingInterval);
  }

  // Set up connection event handlers
  socket.on('connect', () => {
    console.log('Connected to Socket.IO server with ID:', socket.id);
    socket.emit('join', topicId);
    
    // Start sending periodic pings
    pingInterval = setInterval(() => {
      socket.emit('ping');
    }, 25000);
  });

  socket.on('joined', (data) => {
    console.log('Successfully joined topic:', data.topicId);
  });

  socket.on('pong', () => {
    console.log('Received pong from server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from Socket.IO server. Reason:', reason);
    clearInterval(pingInterval);
    
    // Attempt to reconnect if not already attempting
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  // Connect if not already connected
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  clearInterval(pingInterval);
  socket.disconnect();
};

// Additional error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Successfully reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Attempting to reconnect:', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
});

