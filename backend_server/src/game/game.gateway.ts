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
import { LoggerWithRes } from 'src/shared/class/shared.response.msg/shared.response.msg';
import { AuthGuard } from 'src/auth/auth.guard';
import { GameBasicAnswerDto } from './dto/game.basic.answer.dto';
import { GamePingReceiveDto } from './dto/game.ping.dto';
import { GameStartDto } from './dto/game.start.dto';
import { KeyPressDto } from './dto/key.press.dto';
import { GamePhase } from './enum/game.phase';

const front = process.env.FRONTEND;
@WebSocketGateway({
  namespace: 'game/playroom',
  cors: {
    origin: [
      'http://paulryu9309.ddns.net:3000',
      'http://localhost:3000',
      front,
    ],
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
    this.messanger.logWithMessage(
      'handleConnection',
      '',
      '',
      'connection handling is start',
    );

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
      client.disconnect();
      return;
    }
    // this.messanger.logWithMessage("handleConnection", "", "","connection handling is status Player");
    this.gameService.changeStatusForPlayer(userIdx);
    // this.messanger.logWithMessage("handleConnection", "", "","connection handling is after status Player");
    const players = this.gameService.checkQueue(userIdx);
    // this.messanger.logWithMessage("handleConnection", "", "","connection handling is check Queue");

    if (players === undefined) {
      // this.messanger.logWithMessage("handleConnection", "", "","check players");
      return this.messanger.setResponseMsgWithLogger(
        200,
        'you are ready',
        'handleConnection',
      );
    } else this.gameService.makePlayerRoom(players, this.server);
    // this.messanger.logWithMessage("handleConnection", "", "","connection handling is successed");
    return this.messanger.setResponseMsgWithLogger(
      200,
      'room is setted',
      'handleConnection',
    );
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
    // console.log('ret', ret)
    // console.log('data', data)
    // console.log("success", this.server.sockets)
    if (ret === null) client.disconnect(true);
    else if (ret === true) {
      console.log('game ready');
      // this.messanger.logWithMessage("getReadyForGame", "", "", "ping is ready");
      const roomId = this.gameService.findGameRoomIdByUserId(userIdx);
      setTimeout(() => {
        this.gameService.readyToSendPing(roomId, this.server);
      }, 1200);
      // this.gameService.readyToSendPing(roomId, this.server);
      this.gameService.uncheckReady(userIdx);
      return this.messanger.setResponseMsgWithLogger(
        200,
        'game is start soon!',
        'game_queue_susccess',
      );
    }
    // this.messanger.logWithMessage("game_queue_success", "", "","game_queue_success is successed");
    return this.messanger.setResponseMsgWithLogger(
      201,
      'game is ready',
      'game_queue_susccess',
    );
  }

  @SubscribeMessage('game_ping_receive')
  async getUserPong(@MessageBody() data: GamePingReceiveDto) {
    // this.messanger.logWithMessage("game_ping", "", "","game_ping is started");
    // this.messanger.logWithMessage("game_ping", "", "",`user : ${data.userIdx}`);
    // console.log("game_ping_receive", this.server.sockets);
    const time = Date.now();
    const latency = (time - data.serverTime) / 2;

    if (this.gameService.receivePing(data.userIdx, latency)) {
      const targetRoom = this.gameService.findGameRoomById(data.userIdx);
      this.server
        .to(targetRoom.roomId)
        .emit('game_start', new GameStartDto(targetRoom));
      // this.messanger.logWithMessage("game_ping", "", "","game is start now");
      setTimeout(() => {
        this.gameService.startGame(data.userIdx, this.server, this.gameService);
      }, 5000);
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
    const targetRoom = this.gameService.findGameRoomById(data.userIdx);
    console.log(`key board signal = ${data.userIdx} : ${data.paddle}`);
    targetRoom.keyPressed(data.userIdx, data.paddle);
    if (this.gameService.checkLatencyOnPlay(targetRoom, data)) {
      return this.messanger.setResponseMsgWithLogger(
        202,
        'Frame is changed',
        'game_move_paddle',
      );
    } else
      return this.messanger.setResponseMsgWithLogger(
        202,
        'Frame is changed',
        'game_move_paddle',
      );
  }

  @SubscribeMessage('game_pause_score')
  getPauseStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GameBasicAnswerDto,
  ) {
    const userIdx = data.userIdx;
    const ret = this.gameService.checkReady(userIdx);
    const target = this.gameService.findGameRoomById(userIdx);
    if (ret === null) client.disconnect(true);
    else if (
      ret === true &&
      (target.gameObj.gamePhase = GamePhase.SET_NEW_GAME)
    ) {
      const roomId = this.gameService.findGameRoomIdByUserId(userIdx);
      setTimeout(() => {
        this.gameService.readyToSendPing(roomId, this.server);
      }, 1200);
      this.gameService.uncheckReady(userIdx);
    } else if (
      ret === true &&
      (target.gameObj.gamePhase = GamePhase.MATCH_END)
    ) {
      this.gameService.uncheckReady(userIdx);
      const roomId = target.deleteRoom();
      this.gameService.deleteplayRoomByRoomId(roomId);
    }
    return this.messanger.setResponseMsgWithLogger(
      200,
      'please Wait. Both Player is ready',
      'game_pause_score',
    );
  }

  @SubscribeMessage('game_force_quit')
  getQuitSignal(@MessageBody() data: GameBasicAnswerDto) {}

  @SubscribeMessage('game_queue_quit')
  quitQueue(@MessageBody() data: GameBasicAnswerDto) {
    if (this.gameService.pullOutQueuePlayerByUserId(data.userIdx)) {
      return this.messanger.setResponseMsgWithLogger(
        200,
        'success to quit queue from list',
        'game_queue_quit',
      );
    } else {
      return this.messanger.setResponseMsgWithLogger(
        400,
        'failed to quit queue from list',
        'game_queue_quit',
      );
    }
  }
}
