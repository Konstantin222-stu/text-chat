import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
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
    private userRoomsMap;
    private userUsernameMap;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private leaveAllRooms;
    handleJoinRoom(client: Socket, data: JoinRoomData): Promise<void>;
    handleSendMessage(client: Socket, data: MessageData): {
        event: string;
        error: string;
        data?: undefined;
    } | {
        event: string;
        data: {
            succes: boolean;
        };
        error?: undefined;
    };
    handleLeaveRoom(client: Socket): {
        event: string;
        data: string;
    };
}
export {};
