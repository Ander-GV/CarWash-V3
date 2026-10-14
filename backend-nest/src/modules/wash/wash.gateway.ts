import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { FaseLavado } from '../../common/enums/wash-stage.enum';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/wash-stream',
})
export class GatewayLavado implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GatewayLavado.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente WebSocket conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente WebSocket desconectado: ${client.id}`);
  }

  @SubscribeMessage('subscribe_session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `session_${data.sessionId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} suscrito a sala de lavado: ${room}`);
    return { status: 'SUBSCRIBED', room };
  }

  @SubscribeMessage('subscribe_admin_live')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin_live_room');
    this.logger.log(`Admin ${client.id} suscrito al monitor en vivo de autolavado`);
    return { status: 'ADMIN_SUBSCRIBED' };
  }

  broadcastStageChange(sessionId: string, stage: FaseLavado, metadata?: any) {
    const payload = {
      sessionId,
      stage,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.server.to(`session_${sessionId}`).emit('stage_updated', payload);
    this.server.to('admin_live_room').emit('admin_session_stage_updated', payload);
  }

  broadcastBarrierOpened(sessionId: string) {
    const payload = {
      sessionId,
      event: 'BARRIER_OPENED',
      timestamp: new Date().toISOString(),
    };
    this.server.to(`session_${sessionId}`).emit('barrier_status', payload);
    this.server.to('admin_live_room').emit('barrier_status', payload);
  }
}

// Alias para compatibilidad
export const WashGateway = GatewayLavado;
