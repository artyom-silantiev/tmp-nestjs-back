import {
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { useStdLogger } from '_libs/share/logger';

@WebSocketGateway({ namespace: 'gateway' })
export class FantomGatewayGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}

  @WebSocketServer()
  server: Server;

  private logger = useStdLogger('FantomDashboardGateway');

  afterInit(server: Server) {
    this.logger.debug('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    client.disconnect();
  }
}
