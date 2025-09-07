import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId && typeof userId === 'string') {
      client.join(`user:${userId}`);
      console.log(`User connected: ${userId}`);
    } else {
      console.warn('Connection rejected: Invalid or missing userId');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId && typeof userId === 'string') {
      client.leave(`user:${userId}`);
      console.log(`User disconnected: ${userId}`);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (userId && typeof userId === 'string') {
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }
}