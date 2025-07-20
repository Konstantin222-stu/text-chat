import { Server, Socket } from 'socket.io';
export declare class ChatGateway {
    server: Server;
    handleFirstConnect(client: Socket): void;
    handleMessage(data: string, client: Socket): void;
}
