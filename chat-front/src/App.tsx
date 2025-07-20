import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const socket : Socket = io("http://localhost:3000")

interface Message{
  message: string,
  clientId: string,
}

const App: React.FC = () =>{
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  
  useEffect(()=>{
    socket.on('message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });
    
    return()=>{
      socket.off("message")
    }
  },[])

  const sendMessage = ()=>{
    if(message.trim()){
      socket.emit("message", message)
      setMessage("")
    }
  }

  return (
    <>
    <h1>Текстовой чат вы {socket.id}</h1>
    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
    <div className="chat">
      {messages.map((message,index)=>(
        <>
        <div key={index}>
            <strong>{message.clientId}:</strong> {message.message}
        </div>
        </>
      ))}
    </div>
    </>
  );
};

export default App
