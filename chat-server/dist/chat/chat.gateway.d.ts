import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface JoinRoomData {
    roomId: string;
    username: string;
}
interface MessageData {
    text: string;
}
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private rooms;
    private userRoomMap;
    private userUsernameMap;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private leaveAllRooms;
    handleTyping(client: Socket, data: {
        isTyping: boolean;
    }): void;
    handleJoinRoom(client: Socket, data: JoinRoomData): Promise<void>;
    handleSendMessage(client: Socket, data: MessageData): {
        event: string;
        error: string;
        data?: undefined;
    } | {
        event: string;
        data: {
            success: boolean;
        };
        error?: undefined;
    };
    handleLeaveRoom(client: Socket): {
        event: string;
        data: string;
    };
}
export {};
