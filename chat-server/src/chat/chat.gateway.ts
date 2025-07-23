import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auth/ws-jwt.guard';
import { Room } from 'src/models/room.model';
import * as bcrypt from "bcrypt"
import { UserRoom } from 'src/models/user-room.model';
import { Message } from 'src/models/message.model';
import { User } from 'src/models/user.model';

interface Users {
  id: string;
  username: string;
}

interface JoinRoomData {
  roomId: string;
  username: string;
}

interface MessageData {
  text: string;
}

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
})

@UseGuards(WsJwtGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<Users>> = new Map();
  private userRoomMap: Map<string, string> = new Map();
  private userUsernameMap: Map<string, string> = new Map();
  
    private async getRoomMembers(roomId: number): Promise<{id: number, username: string}[]> {
    const users = await User.findAll({
      include: [{
        model: UserRoom,
        where: { roomId },
        attributes: [],
      }],
      attributes: ['id', 'username'],
    });

    return users.map(user => ({
      id: user.id,
      username: user.username,
    }));
  }

  afterInit(server: Server) {
    console.log('WebSocket Server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.leaveAllRooms(client);
  }

  private leaveAllRooms(client: Socket) {
    const roomId = this.userRoomMap.get(client.id);
    if (!roomId) return;

    client.leave(roomId);
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Find and remove the user
    const username = this.userUsernameMap.get(client.id) || 'Unknown';
    for (const user of room) {
      if (user.id === client.id) {
        room.delete(user);
        break;
      }
    }

    // Cleanup if room is empty
    if (room.size === 0) {
      this.rooms.delete(roomId);
    } else {
      // Notify remaining members
      const members = Array.from(room).map(u => u.username);
      this.server.to(roomId).emit('userLeft', {
        userId: client.id,
        username,
        members,
      });
    }

    this.userRoomMap.delete(client.id);
    this.userUsernameMap.delete(client.id);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isTyping: boolean }
  ){
    const roomId =this.userRoomMap.get(client.id)
    if(!roomId) return

    const username = this.userUsernameMap.get(client.id) || 'Unknown';
    client.to(roomId).emit('typingStatus', {
      username,
      isTyping: data.isTyping
    })
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomData,
  ) {
    const { roomId, username } = data;

    if (!roomId || !username) {
      client.emit('joinRoomResponse', { 
        event: 'error', 
        error: 'Room ID and username are required' 
      });
      return;
    }

    try {
      this.leaveAllRooms(client);
      
      client.join(roomId);
      this.userRoomMap.set(client.id, roomId);
      this.userUsernameMap.set(client.id, username);

      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        client.emit('joinRoomResponse', { 
          event: 'error', 
          error: 'Failed to join room' 
        });
        return;
      }

      room.add({ id: client.id, username });

      const members = Array.from(room).map(u => u.username);

      // Notify room about new user
      this.server.to(roomId).emit('userJoined', {
        userId: client.id,
        username,
        members,
      });
      
      // Send response to client
      client.emit('joinRoomResponse', {
        event: 'roomJoined',
        data: {
          roomId,
          username,
          members,
        },
      });

    } catch (error) {
      console.error('Error joining room:', error);
      client.emit('joinRoomResponse', { 
        event: 'error', 
        error: 'Internal server error' 
      });
    }
  }

  @SubscribeMessage('createRoom')
    async handleCreateRoom(
      @ConnectedSocket() client: Socket & { user: any },
      @MessageBody() data: { name: string; isPrivate: boolean; password?: string }
    ) {
      const room = await Room.create({
        name: data.name,
        isPrivate: data.isPrivate,
        password: data.isPrivate ? await bcrypt.hash(data.password, 10) : null,
      });

      await UserRoom.create({
        userId: client.user.sub,
        roomId: room.id,
      });

      client.join(`room_${room.id}`);
      client.emit('roomCreated', room);
  }

  @SubscribeMessage('joinPrivateRoom')
async handleJoinPrivateRoom(
  @ConnectedSocket() client: Socket & { user: any },
  @MessageBody() data: { roomId: number; password?: string }
) {
  const room = await Room.findByPk(data.roomId);
  
  if (!room) {
    throw new WsException('Room not found');
  }

  if (room.isPrivate && !(await bcrypt.compare(data.password, room.password))) {
    throw new WsException('Invalid password');
  }

  await UserRoom.findOrCreate({
    where: {
      userId: client.user.sub,
      roomId: room.id,
    },
  });

  client.join(`room_${room.id}`);
  
  const messages = await Message.findAll({
    where: { roomId: room.id },
    include: [User],
    order: [['createdAt', 'ASC']],
    limit: 50,
  });

  client.emit('roomJoined', {
    room,
    messages,
    members: await this.getRoomMembers(room.id),
  });
}

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket & { user: any },
    @MessageBody() data: { text: string; roomId: number },
  ) {

    const message = await Message.create({
      text: data.text,
      userId: client.user.sub,
      roomId: data.roomId,
    });

    const messageWithUser = await Message.findByPk(message.id, {
      include: [User],
    });
    

    this.server.to(`room_${data.roomId}`).emit('newMessage', messageWithUser);
  }

  @SubscribeMessage('getHistory')
    async handleGetHistory(
      @ConnectedSocket() client: Socket,
      @MessageBody() roomId: number
    ) {
      const message = await Message.findAll({
        where: {roomId},
        include: [User],
        order: [['createdAt', 'ASC']],
        limit: 50,
      })

      client.emit('messageHistory', message)
  }


  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    this.leaveAllRooms(client);
    client.emit('leaveRoomResponse', { 
      event: 'roomLeft', 
      data: 'You left the room' 
    });
    return { event: 'roomLeft', data: 'You left the room' };
  }
}