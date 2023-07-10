import { DataSource } from 'typeorm';
import { Channel, ChannelMember, Message } from './chat.entity';

export const chatProviders = [
    {
        provide: 'MESSAGE_REPOSITORY',
        userFactory: (connection: DataSource) => connection.getRepository(Message),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CHANNEL_REPOSITORY',
        userFactory: (connection: DataSource) => connection.getRepository(Channel),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CHANNEL_MEMBER_REPOSITORY',
        userFactory: (connection: DataSource) => connection.getRepository(ChannelMember),
        inject: ['DATA_SOURCE'],
    },
];