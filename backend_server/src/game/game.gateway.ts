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
// import { ReturnMsgDto } from './dto/error.message.dto';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { WsExceptionFilter } from 'src/ws.exception.filter';
import { UsersService } from 'src/users/users.service';
import { GameOptionDto } from './dto/game.option.dto';
import { GameRegiDto } from './dto/game.regi.dto';
import { GameLatencyGetDto } from './dto/game.latency.get.dto';
import { GameCancleDto } from './dto/game.cancle.dto';
import { GamePaddleMoveDto } from './dto/game.paddle.move.dto';
import { GameScoreDto } from './dto/game.score.dto';
import { GameBallEventDto } from './dto/game.ball.event.dto';
import { GameFriendMatchDto } from './dto/game.friend.match.dto';
import { GameType } from './enum/game.type.enum';
import {
  LoggerWithRes,
  ReturnMsgDto,
} from 'src/shared/class/shared.response.msg/shared.response.msg';
import { AuthGuard } from 'src/auth/auth.guard';
import { connect } from 'http2';
import { InMemoryUsers } from 'src/users/users.provider';

@WebSocketGateway({
  namespace: 'game/playroom',
  cors: {
    origin: ['http://paulryu9309.ddns.net:3000', 'http://localhost:3000'],
  },
})
@UseFilters(new WsExceptionFilter())
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  messanger: LoggerWithRes = new LoggerWithRes('GameGateway');

  constructor(private readonly gameService: GameService) {}

  handleDisconnect(client: Socket) {
    const userIdx: number = parseInt(client.handshake.query.userId as string);
    if (Number.isNaN(userIdx)) return;
    // TODO: 큐, 방에서 모두 나가도록 처리
    // TODO: online 멤버에서 나가기 처리
  }

  handleConnection(client: Socket) {
    const userIdx: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    if (Number.isNaN(userIdx)) return;
    const date = Date.now();
    this.messanger.logWithMessage('handleConnection', '', '', 'check here!!!');

    this.messanger.logWithMessage('handleConnection', '', '', '');
    this.messanger.logWithMessage('handleConnection', '', '', 'check here!!!');

    //TODO: userObject 가져오기
    //TODO: userObject online 관리 대상으로 만들기
  }

  afterInit(server: any) {}

  @SubscribeMessage('game_queue_success')
  getReadyForGame(@MessageBody() userIdx: number) {}

  @SubscribeMessage('game_ping')
  //   getUserPing(@MessageBody() data: PingDto) {}
  getUserPing(@MessageBody() data: any) {}

  @SubscribeMessage('game_move_paddle')
  //   getKeyPressData(@MessageBody() data: KeyPressDto) {}
  getKeyPressData(@MessageBody() data: any) {}

  @SubscribeMessage('game_pause_score')
  getPauseStatus(@MessageBody() userIdx: number) {}

  @SubscribeMessage('game_force_quit')
  getQuitSignal(@MessageBody() userIdx: number) {}

  @SubscribeMessage('game_queue_quit')
  quitQueue(@MessageBody() userIdx: number) {}
}
