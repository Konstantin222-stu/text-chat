import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { error } from 'console';
import { timestamp } from 'rxjs';
import { Server,Socket } from 'socket.io';

interface User {
  id: string,
  username: string,
}

interface JoinRoomData{
  roomId: string,
  username: string,
}

interface MessageData{
  text: string,
}

@WebSocketGateway({
  cors:{
    origin: '*',
    methods: ['GET','POST'],
  }
})

export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server

  private rooms : Map<string, Set<User>> = new Map()
  private userRoomsMap: Map<string, string> = new Map()
  private userUsernameMap: Map<string, string> = new Map()

  afterInit(server:Server) {
    console.log('WebSocket Сервер проинициализированн');
  }

  handleConnection(client: Socket) {
    console.log('Клиент подключился', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Клиент отключился', client.id);
  }
  
  private leaveAllRooms(client: Socket){
    const roomId = this.userRoomsMap.get(client.id)
    if(!roomId) return

    client.leave(roomId)

    const room = this.rooms.get(roomId)
    if(!room) return

    const username = this.userUsernameMap.get(client.id) || 'Unknown'

    for(const user of room){
      if(user.id == client.id){
        room.delete(user)
        break
      }
    }
    if(room.size === 0){
      this.rooms.delete(roomId)
    } else{
      const members = Array.from(room).map(u => u.username)
      this.server.to(roomId).emit("userLeft", {
        userId: client.id,
        username,
        members
      })
    }
    this.userRoomsMap.delete(client.id)
    this.userUsernameMap.delete(client.id)
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomData
  ){
    const {roomId, username} = data
    if (!roomId || !username){
      client.emit('joinRoomResponse', {
        event: 'error',
        error: 'Room id and username are required'
      })
    }

    try{
      this.leaveAllRooms(client)
      client.join(roomId)
      this.userRoomsMap.set(client.id, roomId)
      this.userUsernameMap.set(client.id, username)

      if(!this.rooms.has(roomId)){
        this.rooms.set(roomId, new Set())
      }
      const room = this.rooms.get(roomId)
      if(!room){
        client.emit("joinRoomResponse", {
          event: 'error',
          error: 'Failed to join room',
        })
        return
      }
      room.add({id:client.id, username})
      const members = Array.from(room).map(u => u.username)
      
      this.server.to(roomId).emit('userJoined',{
        userId: client.id,
        username,
        members
      })

      client.emit("joinRoomResponse", {
        event: "roomJoined",
        data:{
          roomId,
          username,
          members
        }
      })
    }
    catch(error){
      console.error("Error join room", error)
      client.emit("joinRoomResponce", {
        event: "error",
        error: "Internal server error"
      })
    }
  }

  @SubscribeMessage("sendMessage")
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageData,
  ){
    const roomId = this.userRoomsMap.get(client.id)
    if(!roomId) return {event:"error", error: "You are not in any room"}

    const username = this.userUsernameMap.get(client.id) || "Unknown"
    const message = {
      userId : client.id,
      username,
      text: data.text,
      timestamp: new Date().toISOString(),
    }

    this.server.to(roomId).emit("newMessage", message)
    return{event: "messageSent", data: {succes: true}}
  }
  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(@ConnectedSocket() client: Socket){
    this.leaveAllRooms(client)
    client.emit("leaveRoomResponse", {
      event: 'roomLeft',
      data: "You left the room"
    })
    return {event: "roomLeft", data: "You left room"}
  }
}
