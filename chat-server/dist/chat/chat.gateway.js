"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const ws_jwt_guard_1 = require("../auth/ws-jwt.guard");
const room_model_1 = require("../models/room.model");
const bcrypt = require("bcrypt");
const user_room_model_1 = require("../models/user-room.model");
const message_model_1 = require("../models/message.model");
const user_model_1 = require("../models/user.model");
let ChatGateway = class ChatGateway {
    server;
    rooms = new Map();
    userRoomMap = new Map();
    userUsernameMap = new Map();
    async getRoomMembers(roomId) {
        const users = await user_model_1.User.findAll({
            include: [{
                    model: user_room_model_1.UserRoom,
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
    afterInit(server) {
        console.log('WebSocket Server initialized');
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.leaveAllRooms(client);
    }
    leaveAllRooms(client) {
        const roomId = this.userRoomMap.get(client.id);
        if (!roomId)
            return;
        client.leave(roomId);
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const username = this.userUsernameMap.get(client.id) || 'Unknown';
        for (const user of room) {
            if (user.id === client.id) {
                room.delete(user);
                break;
            }
        }
        if (room.size === 0) {
            this.rooms.delete(roomId);
        }
        else {
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
    handleTyping(client, data) {
        const roomId = this.userRoomMap.get(client.id);
        if (!roomId)
            return;
        const username = this.userUsernameMap.get(client.id) || 'Unknown';
        client.to(roomId).emit('typingStatus', {
            username,
            isTyping: data.isTyping
        });
    }
    async handleJoinRoom(client, data) {
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
            this.server.to(roomId).emit('userJoined', {
                userId: client.id,
                username,
                members,
            });
            client.emit('joinRoomResponse', {
                event: 'roomJoined',
                data: {
                    roomId,
                    username,
                    members,
                },
            });
        }
        catch (error) {
            console.error('Error joining room:', error);
            client.emit('joinRoomResponse', {
                event: 'error',
                error: 'Internal server error'
            });
        }
    }
    async handleCreateRoom(client, data) {
        const room = await room_model_1.Room.create({
            name: data.name,
            isPrivate: data.isPrivate,
            password: data.isPrivate ? await bcrypt.hash(data.password, 10) : null,
        });
        await user_room_model_1.UserRoom.create({
            userId: client.user.sub,
            roomId: room.id,
        });
        client.join(`room_${room.id}`);
        client.emit('roomCreated', room);
    }
    async handleJoinPrivateRoom(client, data) {
        const room = await room_model_1.Room.findByPk(data.roomId);
        if (!room) {
            throw new websockets_1.WsException('Room not found');
        }
        if (room.isPrivate && !(await bcrypt.compare(data.password, room.password))) {
            throw new websockets_1.WsException('Invalid password');
        }
        await user_room_model_1.UserRoom.findOrCreate({
            where: {
                userId: client.user.sub,
                roomId: room.id,
            },
        });
        client.join(`room_${room.id}`);
        const messages = await message_model_1.Message.findAll({
            where: { roomId: room.id },
            include: [user_model_1.User],
            order: [['createdAt', 'ASC']],
            limit: 50,
        });
        client.emit('roomJoined', {
            room,
            messages,
            members: await this.getRoomMembers(room.id),
        });
    }
    async handleSendMessage(client, data) {
        const message = await message_model_1.Message.create({
            text: data.text,
            userId: client.user.sub,
            roomId: data.roomId,
        });
        const messageWithUser = await message_model_1.Message.findByPk(message.id, {
            include: [user_model_1.User],
        });
        this.server.to(`room_${data.roomId}`).emit('newMessage', messageWithUser);
    }
    async handleGetHistory(client, roomId) {
        const message = await message_model_1.Message.findAll({
            where: { roomId },
            include: [user_model_1.User],
            order: [['createdAt', 'ASC']],
            limit: 50,
        });
        client.emit('messageHistory', message);
    }
    handleLeaveRoom(client) {
        this.leaveAllRooms(client);
        client.emit('leaveRoomResponse', {
            event: 'roomLeft',
            data: 'You left the room'
        });
        return { event: 'roomLeft', data: 'You left the room' };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinPrivateRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinPrivateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getHistory'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGetHistory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveRoom", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'chat',
        cors: {
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST'],
        },
    }),
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard)
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map