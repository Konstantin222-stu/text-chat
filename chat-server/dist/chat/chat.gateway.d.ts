import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface JoinRoomData {
    roomId: string;
    username: string;
}
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private rooms;
    private userRoomMap;
    private userUsernameMap;
    private getRoomMembers;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private leaveAllRooms;
    handleTyping(client: Socket, data: {
        isTyping: boolean;
    }): void;
    handleJoinRoom(client: Socket, data: JoinRoomData): Promise<void>;
    handleCreateRoom(client: Socket & {
        user: any;
    }, data: {
        name: string;
        isPrivate: boolean;
        password?: string;
    }): Promise<void>;
    handleJoinPrivateRoom(client: Socket & {
        user: any;
    }, data: {
        roomId: number;
        password?: string;
    }): Promise<void>;
    handleSendMessage(client: Socket & {
        user: any;
    }, data: {
        text: string;
        roomId: number;
    }): Promise<void>;
    handleGetHistory(client: Socket, roomId: number): Promise<void>;
    handleLeaveRoom(client: Socket): {
        event: string;
        data: string;
    };
}
export {};
