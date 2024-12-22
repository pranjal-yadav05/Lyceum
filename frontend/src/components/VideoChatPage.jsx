import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const VideoChatPage = () => {
  const { roomId } = useParams(); // Room ID from the URL
  const [peers, setPeers] = useState([]); // Store remote users' streams
  const myVideoRef = useRef(); // Ref for my own video
  const socket = useRef();
  const peerConnections = useRef({}); // To manage WebRTC peer connections
  const [myStream, setMyStream] = useState(null); // Store local stream

  useEffect(() => {
    // Initialize socket connection
    const addr = process.env.REACT_APP_SOCKET_URL;
    socket.current = io(addr); 

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;

        // Notify server about joining the room
        const userId = socket.current.id;
        socket.current.emit('join-room', { roomId, userId });

        // Handle existing users in the room
        socket.current.on('existing-users', (existingUsers) => {
          existingUsers.forEach((userId) => {
            if (!peerConnections.current[userId]) {
              createPeerConnection(userId, stream, true);
            }
          });
        });

        // Handle new user connection
        socket.current.on('user-connected', (userId) => {
          console.log('User connected:', userId);
          if (!peerConnections.current[userId]) {
            createPeerConnection(userId, stream, true);
          }
        });

        // Handle user disconnection
        socket.current.on('user-disconnected', (userId) => {
          console.log('User disconnected:', userId);
          if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
          }
          setPeers((prevPeers) => prevPeers.filter((peer) => peer.id !== userId));
        });

        // Handle signaling messages
        socket.current.on('signal', ({ from, data }) => {
          console.log(`Received signal from ${from}:`, data);
          if (peerConnections.current[from]) {
            handleSignalingData(peerConnections.current[from], data);
          }
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      // Cleanup logic
      socket.current?.disconnect();
      Object.values(peerConnections.current).forEach((connection) => connection.close());
      peerConnections.current = {};
    };
  }, [roomId]);

  const createPeerConnection = (userId, stream, isInitiator = true) => {
    if (!stream) {
      console.error(`Stream is null or undefined for user ${userId}`);
      return;
    }

    console.log(`Creating peer connection for user: ${userId}`);
    const peerConnection = new RTCPeerConnection();

    // Add local tracks to the peer connection
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    // Handle remote streams
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setPeers((prevPeers) => {
          if (prevPeers.some((peer) => peer.id === userId)) return prevPeers; // Avoid duplicates
          return [...prevPeers, { id: userId, stream: remoteStream }];
        });
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit('signal', { to: userId, data: event.candidate });
      }
    };

    // Create offer if this is the initiator
    if (isInitiator) {
      peerConnection
        .createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
          socket.current.emit('signal', { to: userId, data: peerConnection.localDescription });
        })
        .catch((err) => console.error('Error creating offer:', err));
    }

    peerConnections.current[userId] = peerConnection; // Save the peer connection
  };

  const handleSignalingData = (peerConnection, data) => {
    if (data.type === 'offer' || data.type === 'answer') {
      peerConnection
        .setRemoteDescription(new RTCSessionDescription(data))
        .catch((err) => console.error('Error setting remote description:', err));
    } else if (data.candidate) {
      peerConnection
        .addIceCandidate(new RTCIceCandidate(data))
        .catch((err) => console.error('Error adding ICE candidate:', err));
    }
  };

  return (
    <div>
      <h1>Room: {roomId}</h1>
      <video ref={myVideoRef} autoPlay muted style={{ width: '300px', height: '200px' }} />
      <div>
        {peers.map((peer) => (
          <video
            key={peer.id}
            autoPlay
            ref={(el) => {
              if (el && peer.stream) el.srcObject = peer.stream;
            }}
            style={{ width: '300px', height: '200px' }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoChatPage;
