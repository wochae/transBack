import { DataSource } from 'typeorm';
import { Channel, ChannelMember, Message } from './chat.entity';

export const chatProviders = [
    {
        provide: 'MESSAGES_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Message),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CHANNELS_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Channel),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CHANNELMEMBERS_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(ChannelMember),
        inject: ['DATA_SOURCE'],
    },
];