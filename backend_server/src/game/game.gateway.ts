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

  constructor(
    private readonly gameService: GameService,
    private readonly uerService: UsersService,
  ) {}

  handleDisconnect(client: Socket) {
    const userIdx: number = parseInt(client.handshake.query.userId as string);
    if (Number.isNaN(userIdx)) return;
    // TODO: 큐, 방에서 모두 나가도록 처리
    // TODO: online 멤버에서 나가기 처리
  }

  handleConnection(client: any, ...args: any[]) {
    const userIdx: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    if (Number.isNaN(userIdx)) return;
    const date = Date.now();
    //TODO: userObject 가져오기
    //TODO: userObject online 관리 대상으로 만들기
  }

  afterInit(server: any) {}
}
