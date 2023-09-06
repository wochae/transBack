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
import { GameLatencyGetDto } from './dto/game.latency.get.dto';
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
import { InMemoryUsers } from 'src/users/users.provider';
import { GamePlayer } from './class/game.player/game.player';
import { GameBasicAnswerDto } from './dto/game.basic.answer.dto';
import { GamePingReceiveDto } from './dto/game.ping.dto';
import { GameStartDto } from './dto/game.start.dto';
import { KeyPressDto } from './dto/key.press.dto';

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
    // TODO: 큐, 방에서 모두 나가도록 처리(게임중이라면)
    // TODO: online 멤버에서 나가기 처리
  }

  handleConnection(client: Socket) {
    const userIdx: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    if (Number.isNaN(userIdx)) return;
    if (!this.gameService.setSocketToPlayer(client, userIdx)) {
      this.messanger.logWithWarn(
        'handleConnection',
        'userIdx',
        `${userIdx}`,
        'not proper access',
      );
      client.disconnect(true);
    }
    this.gameService.changeStatusForPlayer(userIdx);
    const players = this.gameService.checkQueue(userIdx);
    if (players === false || players === true) return;
    else this.gameService.makePlayerRoom(players, this.server);
  }

  afterInit() {
    this.messanger.logWithMessage('afterInit', 'GameGatway', 'Initialize!');
  }

  @SubscribeMessage('game_queue_success')
  getReadyForGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GameBasicAnswerDto,
  ) {
    const userIdx = data.userIdx;
    const ret = this.gameService.checkReady(userIdx);
    if (ret === null) client.disconnect(true);
    else if (ret === true) {
      const roomId = this.gameService.findGameRoomIdByUserId(userIdx);
      setTimeout(this.gameService.readyToSendPing, 1000, roomId, this.server);
    } else {
    }
    return this.messanger.setResponseMsgWithLogger(
      200,
      'game is ready',
      'game_queue_susccess',
    );
  }

  @SubscribeMessage('game_ping')
  getUserPong(@MessageBody() data: GamePingReceiveDto) {
    if (this.gameService.receivePing(data)) {
      const targetRoom = this.gameService.findGameRoomById(data.userIdx);
      this.server
        .to(targetRoom.roomId)
        .emit('game_start', new GameStartDto(targetRoom));
      setTimeout(this.gameService.startGame, 2000, data.userIdx, this.server);
      return this.messanger.setResponseMsgWithLogger(
        this.gameService.sendSetFrameRate(data.userIdx),
        'Your max fps is checked',
        'getUserPong',
      );
    } else
      return this.messanger.setResponseMsgWithLogger(
        200,
        'pong is received successfully',
        'getUserPong',
      );
  }

  @SubscribeMessage('game_move_paddle')
  getKeyPressData(@MessageBody() data: KeyPressDto) {
    //TODO: key 입력 넣기
    //TODO: latency check
  }

  @SubscribeMessage('game_pause_score')
  getPauseStatus(@MessageBody() data: GameBasicAnswerDto) {
    // TODO: ready check
    // TODO: reset Game
    // TODO: Start Game
  }

  @SubscribeMessage('game_force_quit')
  getQuitSignal(@MessageBody() userIdx: number) {}

  @SubscribeMessage('game_queue_quit')
  quitQueue(@MessageBody() userIdx: number) {}
}
