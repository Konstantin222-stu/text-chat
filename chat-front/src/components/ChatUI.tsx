import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

export const ChatUI = () => {
  const {
    isConnected,
    currentUser,
    room,
    error,
    joinRoom,
    sendMessage,
    leaveRoom,
    typingUsers,
    sendTypingStatus,
  } = useChat();

  const [roomInput, setRoomInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  
  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages]);

  const handleJoin = () => {
    if (roomInput.trim() && usernameInput.trim()) {
      joinRoom(roomInput.trim(), usernameInput.trim());
      console.log(`Joining room: ${roomInput.trim()} as user: ${usernameInput.trim()}`);
    }
  };

  const handleSend = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handelInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>{
    setMessageInput(e.target.value)

    if (!typingTimeoutRef.current) {
      sendTypingStatus(true);
    }

    if(typingTimeoutRef.current){
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(()=>{
      sendTypingStatus(false)
      typingTimeoutRef.current = undefined
    }, 2000)
  }

  useEffect(()=>{
    return ()=>{
      if(typingTimeoutRef.current){
        clearTimeout(typingTimeoutRef.current)
      }
    }
  },[])

  console.log(`Current user: ${currentUser}, Room ID: ${room.id}`);
  
  return (
    <div className="chat-container">
      {error && <div className="error-message">{error}</div>}

      {!room.id ? (
        <div className="join-form">
          <h2>Join Chat Room</h2>
          <div className="form-group">
            <label>Your Name:</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label>Room ID:</label>
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="Enter room ID"
            />
          </div>
          <button 
            onClick={handleJoin}
            disabled={!roomInput || !usernameInput}
          >
            Join Room
          </button>
          <div className="connection-status">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      ) : (
        <div className="chat-room">
          <div className="chat-header">
            <h2>Room: {room.id}</h2>
            <div className="members-count">
              Members: {room.members.length}
            </div>
            <button onClick={()=>leaveRoom()} className="leave-button">
              Leave Room
            </button>
          </div>

          <div className="messages-container">
            {room.messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.userId === 'System' ? 'system' : 
                  msg.username === currentUser ? 'own' : 'other'
                }`}
              >
                <div className="message-header">
                  <span className="username">{msg.username}</span>
                  <span className="time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'печатают' : 'печатает'}...
            </div>
          )}

          <div className="message-input">
            <input
              type="text"
              value={messageInput}
              onChange={handelInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button 
              onClick={handleSend}
              disabled={!messageInput}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};