import { PeerServer } from 'peer';
import dotenv from 'dotenv';

dotenv.config();

const peerServer = PeerServer({
  port: process.env.PEER_PORT || 9000,
  path: '/',
  allow_discovery: true,
  proxied: true,
  cors: {
    origin: process.env.FRONTEND_URL
  }
});

peerServer.on('connection', (client) => {
  console.log('Client connected to PeerJS server:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected from PeerJS server:', client.getId());
});

console.log(`PeerJS server running on port ${process.env.PEER_PORT || 9000}`);