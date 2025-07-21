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
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let ChatGateway = class ChatGateway {
    server;
    rooms = new Map();
    userRoomsMap = new Map();
    userUsernameMap = new Map();
    afterInit(server) {
        console.log('WebSocket Сервер проинициализированн');
    }
    handleConnection(client) {
        console.log('Клиент подключился', client.id);
    }
    handleDisconnect(client) {
        console.log('Клиент отключился', client.id);
    }
    leaveAllRooms(client) {
        const roomId = this.userRoomsMap.get(client.id);
        if (!roomId)
            return;
        client.leave(roomId);
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const username = this.userUsernameMap.get(client.id) || 'Unknown';
        for (const user of room) {
            if (user.id == client.id) {
                room.delete(user);
                break;
            }
        }
        if (room.size === 0) {
            this.rooms.delete(roomId);
        }
        else {
            const members = Array.from(room).map(u => u.username);
            this.server.to(roomId).emit("userLeft", {
                userId: client.id,
                username,
                members
            });
        }
        this.userRoomsMap.delete(client.id);
        this.userUsernameMap.delete(client.id);
    }
    async handleJoinRoom(client, data) {
        const { roomId, username } = data;
        if (!roomId || !username) {
            client.emit('joinRoomResponse', {
                event: 'error',
                error: 'Room id and username are required'
            });
        }
        try {
            this.leaveAllRooms(client);
            client.join(roomId);
            this.userRoomsMap.set(client.id, roomId);
            this.userUsernameMap.set(client.id, username);
            if (!this.rooms.has(roomId)) {
                this.rooms.set(roomId, new Set());
            }
            const room = this.rooms.get(roomId);
            if (!room) {
                client.emit("joinRoomResponse", {
                    event: 'error',
                    error: 'Failed to join room',
                });
                return;
            }
            room.add({ id: client.id, username });
            const members = Array.from(room).map(u => u.username);
            this.server.to(roomId).emit('userJoined', {
                userId: client.id,
                username,
                members
            });
            client.emit("joinRoomResponse", {
                event: "roomJoined",
                data: {
                    roomId,
                    username,
                    members
                }
            });
        }
        catch (error) {
            console.error("Error join room", error);
            client.emit("joinRoomResponce", {
                event: "error",
                error: "Internal server error"
            });
        }
    }
    handleSendMessage(client, data) {
        const roomId = this.userRoomsMap.get(client.id);
        if (!roomId)
            return { event: "error", error: "You are not in any room" };
        const username = this.userUsernameMap.get(client.id) || "Unknown";
        const message = {
            userId: client.id,
            username,
            text: data.text,
            timestamp: new Date().toISOString(),
        };
        this.server.to(roomId).emit("newMessage", message);
        return { event: "messageSent", data: { succes: true } };
    }
    handleLeaveRoom(client) {
        this.leaveAllRooms(client);
        client.emit("leaveRoomResponse", {
            event: 'roomLeft',
            data: "You left the room"
        });
        return { event: "roomLeft", data: "You left room" };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("sendMessage"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("leaveRoom"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveRoom", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        }
    })
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map