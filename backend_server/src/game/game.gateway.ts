import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from './game.service';

import { ErrorMsgDto } from './dto/errorMessage.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: ['http://localhost:3001'],
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly gameService: GameService) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');

  handleDisconnect(client: any) {
    throw new Error('Method not implemented.');
  }

  handleConnection(client: any, ...args: any[]) {
    throw new Error('Method not implemented.');
  }

  afterInit(server: any) {
    this.logger.log('[ 🎮 Game ] Initialized!');
  }

  @SubscribeMessage('game_option')
  sendGameOption(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_queue_regist')
  putInQueue(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_queue_success')
  sendQueueSuccess(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_queue_quit')
  cancleQueue(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_ready_first')
  readyFirstStep(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_ready_second')
  readySecondStep(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_ready_second_answer')
  getLatency(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_ready_final')
  sendFinalInfo(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_ready_start')
  startGame(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_predict_ball')
  sendBallPrediction(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_move_paddle')
  sendPaddleToTarget(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_pause_score')
  pauseAndNextGame(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }

  @SubscribeMessage('game_get_score')
  endMatch(): ErrorMsgDto {
    return { code: 'this return is error!', msg: 'Hello world!' };
  }
}
