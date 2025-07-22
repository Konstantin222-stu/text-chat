import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

type Message = {
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
};

type RoomState = {
  id: string | null;
  members: string[];
  messages: Message[];
};

export const useChat = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [room, setRoom] = useState<RoomState>({
    id: null,
    members: [],
    messages: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Обработка события kicked
  useEffect(() => {
    if (!socket) return;

    const onKicked = () => {
      setRoom({
        id: null,
        members: [],
        messages: [],
      });
      setCurrentUser('');
      setError('You were disconnected from the room');
    };

    socket.on('kicked', onKicked);

    return () => {
      socket.off('kicked', onKicked);
    };
  }, [socket]);

  // Инициализация сокета
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false, // Добавлено для контроля момента подключения
    });

    const onConnect = () => {
      setIsConnected(true);
      console.log('Connected to WS server');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setRoom(prev => ({
        ...prev,
        members: [],
        messages: [
          ...prev.messages,
          {
            userId: 'system',
            username: 'System',
            text: 'Disconnected from server',
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      }));
    };

    const onUserJoined = (data: {
      userId: string;
      username: string;
      members: string[];
    }) => {
      setRoom(prev => ({
        ...prev,
        members: data.members,
        messages: [
          ...prev.messages,
          {
            userId: data.userId,
            username: 'System',
            text: `${data.username} joined the room`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      }));
    };

    const onUserLeft = (data: {
      userId: string;
      username: string;
      members: string[];
    }) => {
      setRoom(prev => ({
        ...prev,
        members: data.members,
        messages: [
          ...prev.messages,
          {
            userId: data.userId,
            username: 'System',
            text: `${data.username} left the room`,
            timestamp: new Date().toISOString(),
            isSystem: true,
          },
        ],
      }));
    };

    const onNewMessage = (message: Message) => {
      setRoom(prev => ({
        ...prev,
        messages: [...prev.messages, message],
      }));
    };

    const onError = (err: string) => {
      setError(err);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('userJoined', onUserJoined);
    newSocket.on('userLeft', onUserLeft);
    newSocket.on('newMessage', onNewMessage);
    newSocket.on('error', onError);

    setSocket(newSocket);
    newSocket.connect(); // Явное подключение

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('userJoined', onUserJoined);
      newSocket.off('userLeft', onUserLeft);
      newSocket.off('newMessage', onNewMessage);
      newSocket.off('error', onError);
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, username: string) => {
    if (!socket) {
      console.error('Socket is not connected');
      setError('Socket connection not established');
      return;
    }

    setCurrentUser(username);
    setError(null);
    
    console.log(`Attempting to join room: ${roomId} as user: ${username}`);
    
    const handleResponse = (response: {
      event: string;
      data?: { roomId: string; username: string; members: string[] };
      error?: string;
    }) => {
      socket.off('joinRoomResponse', handleResponse);
      
      if (response.event === 'error' && response.error) {
        console.error('Error joining room:', response.error);
        setError(response.error);
        return;
      }
      
      if (response.event === 'roomJoined' && response.data) {
        console.log('Successfully joined room:', response.data);
        setRoom({
          id: response.data.roomId,
          members: response.data.members,
          messages: [],
        });
      } else {
        console.error('Unexpected response format:', response);
        setError('Unexpected server response');
      }
    };

    socket.on('joinRoomResponse', handleResponse);
    socket.emit('joinRoom', { roomId, username });
  }, [socket]);

  const sendMessage = useCallback((text: string) => {
    if (!socket || !room.id) {
      setError('Not connected to any room');
      return;
    }

    const message = {
      text,
      timestamp: new Date().toISOString(),
    };

    socket.emit('sendMessage', message, (response: {
      event: string;
      error?: string;
    }) => {
      if (response.event === 'error' && response.error) {
        setError(response.error);
      }
    });
  }, [socket, room.id]);

  const leaveRoom = useCallback(() => {
    if (!socket || !room.id) return;

    const handleLeaveResponse = () => {
      socket.off('leaveRoomResponse', handleLeaveResponse);
      setRoom({
        id: null,
        members: [],
        messages: [],
      });
      setCurrentUser('');
    };

    socket.on('leaveRoomResponse', handleLeaveResponse);
    socket.emit('leaveRoom', { roomId: room.id });
  }, [socket, room.id]);

  return {
    socket,
    isConnected,
    currentUser,
    room,
    error,
    joinRoom,
    sendMessage,
    leaveRoom,
    setError,
  };
};