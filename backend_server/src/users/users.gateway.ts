import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UsersService } from './users.service';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes } from '@nestjs/common';
import { InsertFriendDto, InsertFriendReqDto, InsertFriendResDto } from './dto/insert-friend.dto';
import { WsExceptionFilter } from 'src/ws.exception.filter';
import { WsValidationPipe } from 'src/ws.exception.pipe';




@WebSocketGateway({
    namespace: 'users',
    cors: {
        origin: ['http://localhost:3000'],
    },
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new WsValidationPipe())
export class UsersGateway 
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
    constructor(private readonly usersService: UsersService) { }

    private logger: Logger = new Logger('UsersGateway');

    @WebSocketServer()
    server: Server;

    afterInit() {
        this.logger.log('[ Users ] Initialized');
    }
    handleConnection(client: Socket) {
        console.log(`[ Users ] Client connected: ${client.id}`);
    }


    handleDisconnect(client: any) {
        console.log(`[ Users ] Client disconnected: ${client.id}`);
    }
    
    @SubscribeMessage('add_friend')
    async handleAddFriend(
        @ConnectedSocket() client: Socket,
        @MessageBody() req: InsertFriendDto,
    ) {
        const { targetNickname, targetIdx } = JSON.parse(req.toString());
        // logic
        const targetUser = await this.usersService.findOneUser(targetIdx);
        const res = await this.usersService.addFriend(targetNickname, targetUser);

        client.emit('add_friend', res);
    }

    
}