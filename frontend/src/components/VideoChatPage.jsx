import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Mic, MicOff, Video, VideoOff, LogOut, MessageCircle, X } from 'lucide-react'
import ChatBox from './ChatBox';

const VideoChatPage = () => {
  const { roomId } = useParams();
  const [peers, setPeers] = useState([]);
  const [userName, setUserName] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const myVideoRef = useRef();
  const socket = useRef();
  const peer = useRef();
  const peersRef = useRef([]);
  const myStreamRef = useRef();
  const [mediaState, setMediaState] = useState(() => {
    const savedState = sessionStorage.getItem('mediaState');
    return savedState ? JSON.parse(savedState) : { video: true, audio: true };
  });

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    setUserName(storedUsername);

    const addr = process.env.REACT_APP_SOCKET_URL;
    socket.current = io(addr, { withCredentials: true });

    socket.current.on('connect', () => {
      setSocketReady(true);
    });

    const initializePeer = () => {
      peer.current = new Peer(undefined, {
        host: process.env.REACT_APP_PEER_HOST,
        port: process.env.REACT_APP_PEER_PORT,
        path: '/',
        debug: 3
      });

      peer.current.on('open', (id) => {
        console.log('PeerJS ID:', id);
        socket.current.emit('join-room', { 
          roomId, 
          userId: id, 
          username: storedUsername,
          mediaState
        });
      });

      peer.current.on('call', async (call) => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        stream.getVideoTracks()[0].enabled = mediaState.video;
        stream.getAudioTracks()[0].enabled = mediaState.audio;
        
        call.answer(stream);
        
        const callerUsername = call.metadata?.username;
        const callerMediaState = call.metadata?.mediaState || { video: true, audio: true };
        
        call.on('stream', (remoteStream) => {
          addPeerStream(call.peer, remoteStream, callerUsername || 'Unknown User', callerMediaState);
        });
      });
    };

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });

        myStreamRef.current = stream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        stream.getVideoTracks()[0].enabled = mediaState.video;
        stream.getAudioTracks()[0].enabled = mediaState.audio;

        socket.current.on('user-connected', ({ userId, username, mediaState }) => {
          console.log(`${username} connected`);
          connectToNewUser(userId, username, mediaState, stream);
        });

        socket.current.on('room-users', (users) => {
          users.forEach(user => {
            if (user.userId !== peer.current.id) {
              connectToNewUser(user.userId, user.username, user.mediaState, stream);
            }
          });
        });

        socket.current.on('media-state-changed', ({ userId, mediaState: newMediaState }) => {
          console.log('Received media state change:', userId, newMediaState);
          setPeers(prevPeers => 
            prevPeers.map(peer => {
              if (peer.id === userId) {
                return { 
                  ...peer, 
                  videoEnabled: newMediaState.video,
                  audioEnabled: newMediaState.audio
                };
              }
              return peer;
            })
          );
        });
        
        socket.current.on('user-disconnected', ({ userId, username }) => {
          console.log(`${username} disconnected`);  
          removePeer(userId);
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    const connectToNewUser = (userId, username, userMediaState, stream) => {
      const call = peer.current.call(userId, stream, {
        metadata: { 
          username: userName,
          mediaState
        }
      });

      call.on('stream', (remoteStream) => {
        addPeerStream(userId, remoteStream, username, userMediaState);
      });

      call.on('close', () => {
        removePeer(userId);
      });

      peersRef.current.push({
        peerId: userId,
        call: call
      });
    };

    const addPeerStream = (id, stream, peerUsername, peerMediaState) => {
      setPeers((prevPeers) => {
        const existingPeer = prevPeers.find(p => p.id === id);
        if (existingPeer) {
          return prevPeers.map(p => 
            p.id === id 
              ? { ...p, stream, username: peerUsername, videoEnabled: peerMediaState.video,
                audioEnabled: peerMediaState.audio }
              : p
          );
        }
        return [...prevPeers, { 
          id, 
          stream, 
          username: peerUsername, 
          videoEnabled: peerMediaState.video,
          audioEnabled: peerMediaState.audio 
        }];
      });
    };

    const removePeer = (userId) => {
      setPeers(prevPeers => prevPeers.filter(peer => peer.id !== userId));
      const peerConnection = peersRef.current.find(p => p.peerId === userId);
      if (peerConnection) {
        peerConnection.call.close();
      }
      peersRef.current = peersRef.current.filter(p => p.peerId !== userId);
    };

    initializePeer();
    initializeMedia();

    return () => {
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(({ call }) => call.close());
      socket.current.disconnect();
      peer.current.destroy();
    };
  }, [roomId, userName]);

  const toggleAudio = () => {
    if (myStreamRef.current) {
      const audioTrack = myStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newAudioState = !mediaState.audio;
        audioTrack.enabled = newAudioState;
        const newMediaState = { ...mediaState, audio: newAudioState };
        setMediaState(newMediaState);
        sessionStorage.setItem('mediaState', JSON.stringify(newMediaState));
        
        socket.current.emit('media-state-changed', {
          roomId,
          userId: peer.current.id,
          mediaState: newMediaState
        });
      }
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      const videoTrack = myStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoState = !mediaState.video;
        videoTrack.enabled = newVideoState;
        const newMediaState = { ...mediaState, video: newVideoState };
        setMediaState(newMediaState);
        sessionStorage.setItem('mediaState', JSON.stringify(newMediaState));
        
        socket.current.emit('media-state-changed', {
          roomId,
          userId: peer.current.id,
          mediaState: newMediaState
        });
      }
    }
  };

  const handleExitRoom = () => {
    if (window.confirm('Are you sure you want to exit the chat room?')) {
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peersRef.current.forEach(({ call }) => call.close());
      socket.current.disconnect();
      peer.current.destroy();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white p-4">
      <div className="mb-4 text-sm text-gray-400">
        <p>Welcome, {userName}! Other participants will appear below.</p>
      </div>

      <Card className="bg-[#1a1425] border-purple-600/20 mb-4">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl md:text-2xl font-bold text-white">Room: {roomId}</CardTitle>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              className={`${!mediaState.audio ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              title={!mediaState.audio ? 'Unmute Audio' : 'Mute Audio'}
            >
              {!mediaState.audio ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVideo}
              className={`${!mediaState.video ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              title={!mediaState.video ? 'Turn Video On' : 'Turn Video Off'}
            >
              {!mediaState.video ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowChat(!showChat)}
              className="bg-blue-500 hover:bg-blue-600 md:hidden"
              title={showChat ? 'Hide Chat' : 'Show Chat'}
            >
              {showChat ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExitRoom}
              className="bg-red-500 hover:bg-red-600"
              title="Exit Chat Room"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 h-[calc(100vh-200px)]">
        <div className={`lg:col-span-3 overflow-auto ${showChat ? 'hidden md:block' : 'block'}`}>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            <Card className="bg-[#1a1425] border-purple-600/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Your Video ({userName})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative pt-[56.25%]">
                  <video
                    ref={myVideoRef}
                    autoPlay
                    muted
                    className={`absolute inset-0 w-full h-full object-cover rounded-md ${
                      !mediaState.video ? 'opacity-50' : ''
                    }`}
                  />
                  {!mediaState.video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                      <VideoOff className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {peers.map((peer) => (
              <Card key={peer.id} className={`bg-[#1a1425] border-purple-600/20 ${
                peer.isActiveSpeaker ? 'border-yellow-400' : ''
              }`}>
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center">
                    {peer.username}
                    <span className="ml-2">
                      {peer.audioEnabled ? (<Mic className='h-4 w-4'/>) : (<MicOff className='h-4 w-4'/>)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative pt-[56.25%]">
                    {peer.videoEnabled ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(videoElement) => {
                          if (videoElement) videoElement.srcObject = peer.stream;
                        }}
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white rounded-md">
                        <VideoOff className="h-8 w-8" />
                        <span className="ml-2 text-sm">{peer.username}'s video is off</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className={`lg:col-span-1 h-full ${showChat ? 'block' : 'hidden md:block'}`}>
          {socketReady && (
            <ChatBox
              socket={socket.current}
              roomId={roomId}
              userId={peer.current?.id}
              username={userName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoChatPage;

