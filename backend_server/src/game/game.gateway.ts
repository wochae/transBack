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
import { check } from 'prettier';
import { GamePingDto } from './dto/game.ping.dto';

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
    if (!this.gameService.findUserIdxProcessedOrNot(userIdx)) {
      this.gameService.forceQuitForForceDisconnect(userIdx, this.server);
    }
    return;
  }

  handleConnection(client: Socket) {
    const userIdx: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    if (Number.isNaN(userIdx)) return;
    this.gameService.popOutProcessedUserIdx(userIdx); // 처리된 사용자지만, 새로이 들어왔다면 다시 빼고 관리 이루어짐
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
    if (players !== undefined) {
      for (const member of players) {
        console.log(`얜 누구니>>>> ${member.getUserObject().userIdx}`);
      }
    }
    // this.messanger.logWithMessage("handleConnection", "", "","connection handling is check Queue");
    if (players === undefined) {
      // this.messanger.logWithMessage("handleConnection", "", "","check players");
      return this.messanger.setResponseMsgWithLogger(
        200,
        'you are ready',
        'handleConnection',
      );
    } else this.gameService.makePlayerRoom(players, this.server, userIdx);
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
    console.log(`gmae_queue_success : `, userIdx);
    const ret = this.gameService.checkReady(userIdx);
    if (ret === null) {
      console.log(`error happens!`);
      client.disconnect(true);
    }
    //TODO: error handling
    else if (ret === true) {
      console.log('game ready');
      const roomId = this.gameService.findGameRoomIdByUserId(userIdx);
      setTimeout(() => {
        this.gameService.readyToSendPing(roomId, this.server);
      }, 1200);
      this.gameService.uncheckReady(userIdx);
      return this.messanger.setResponseMsgWithLogger(
        200,
        'game is start soon!',
        'game_queue_susccess',
      );
    }
    return this.messanger.setResponseMsgWithLogger(
      201,
      'game is ready',
      'game_queue_susccess',
    );
  }

  @SubscribeMessage('game_ping_receive')
  async getUserPong(@MessageBody() data: GamePingReceiveDto) {
    const time = Date.now();
    const latency = (time - data.serverTime) / 2;
    const ret = this.gameService.receivePing(
      data.userIdx,
      latency,
      this.server,
    );
    if (ret === true) {
      const targetRoom = this.gameService.findGameRoomById(data.userIdx);
      this.server
        .to(targetRoom.roomId)
        .emit('game_start', new GameStartDto(targetRoom));
      // this.messanger.logWithMessage("game_ping", "", "","game is start now");
      targetRoom.setGamePhase(GamePhase.SET_NEW_GAME);
      setTimeout(() => {
        this.gameService.startGame(data.userIdx, this.server, this.gameService);
      }, 5000);
      return this.messanger.setResponseMsgWithLogger(
        this.gameService.sendSetFrameRate(data.userIdx, this.server),
        'Your max fps is checked',
        'getUserPong',
      );
    } else if (ret === -1) {
      return this.messanger.setResponseMsgWithLogger(
        400,
        'latency too high',
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
    // console.log(`key board signal = ${data.userIdx} : ${data.paddle}`);
    targetRoom.keyPressed(data.userIdx, data.paddle);
    if (this.gameService.checkLatencyOnPlay(targetRoom, data, this.server)) {
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
    if (ret === null) {
      console.log(`error happens!`);
    }
    //TODO: error handling
    const target = this.gameService.findGameRoomById(userIdx);
    if (ret === null) client.disconnect(true);
    else if (
      ret === true &&
      target.gameObj.gamePhase === GamePhase.SET_NEW_GAME
    ) {
      const roomId = this.gameService.findGameRoomIdByUserId(userIdx);
      setTimeout(() => {
        this.gameService.readyToSendPing(roomId, this.server);
      }, 1200);
      this.gameService.uncheckReady(userIdx);
    } else if (
      ret === true &&
      target.gameObj.gamePhase === GamePhase.MATCH_END
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
  getQuitSignal(@MessageBody() data: GameBasicAnswerDto) {
    this.gameService.forceQuitMatch(data.userIdx, this.server);
  }

  @SubscribeMessage('game_over_quit')
  getQuitProperly(@MessageBody() data: GameBasicAnswerDto) {}

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
