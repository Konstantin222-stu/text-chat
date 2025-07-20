import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server,Socket } from 'socket.io';

@WebSocketGateway({
  cors:{
    origin: '*'
  }
})

export class ChatGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage({ 
    event: 'connect', 
    once: true 
  })

  handleFirstConnect(client:Socket){
    console.log("клент подключен");
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.server.emit('message', { message: data, clientId: client.id });
  }

}
