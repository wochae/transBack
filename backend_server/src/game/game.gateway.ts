import {
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from './game.service';

import { ReturnMsgDto } from './dto/errorMessage.dto';
import { Logger, UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from 'src/ws.exception.filter';
import { UsersService } from 'src/users/users.service';
import { GameOnlineMember } from './class/game.online.member/game.online.member';
import { GameOptionDto } from './dto/gameOption.dto';

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: ['http://localhost:3001'],
  },
})
@UseFilters(new WsExceptionFilter())
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gameService: GameService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');

  handleDisconnect(client: Socket) {
    const userId: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    this.logger.log(userId + ' is disconnected');
  }

  async handleConnection(client: Socket) {
    const userId: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    this.logger.log(userId + ' is connected');
    const user = await this.usersService.getUserObjectFromDB(userId);
    const OnUser = new GameOnlineMember(user, client);
    this.gameService.pushOnlineUser(OnUser).then((data) => {
      if (data === 999) {
        client.disconnect(true);
        return;
      }
      this.logger.log('현재 접속 자 : ' + data);
    });
  }

  afterInit(server: any) {
    this.logger.log('[ 🎮 Game ] Initialized!');
  }

  @SubscribeMessage('game_option')
  sendGameOption(
    @ConnectedSocket() client: Socket,
    @MessageBody() options: GameOptionDto,
  ): ReturnMsgDto {
    this.logger.log(options);
    client.emit('game_option', options);
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_queue_regist')
  putInQueue(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_queue_success')
  sendQueueSuccess(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_queue_quit')
  cancleQueue(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_ready_first')
  readyFirstStep(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_ready_second')
  readySecondStep(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_ready_second_answer')
  getLatency(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_ready_final')
  sendFinalInfo(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_ready_start')
  startGame(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_predict_ball')
  sendBallPrediction(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_move_paddle')
  sendPaddleToTarget(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_pause_score')
  pauseAndNextGame(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_get_score')
  endMatch(): ReturnMsgDto {
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('game_switch_to_chat')
  exitGame(@ConnectedSocket() client: Socket): ReturnMsgDto {
    // DB 설정 변경 필요
    const userIdx = parseInt(client.handshake.query.userId as string);
    this.gameService
      .popOnlineUser(userIdx)
      .then((data) => this.logger.log(data));
    return new ReturnMsgDto(200, 'OK!');
  }
}
