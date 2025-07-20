import { Server, Socket } from 'socket.io';
export declare class ChatGateway {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleMessage(data: string, client: Socket): void;
}
