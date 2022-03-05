import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: 'test' })
export class ExampleGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  event(client: Socket, payload: string) {
    client.emit('response', {
      message: 'PONG',
    });
  }
}
