import { DataSource, Repository } from 'typeorm';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ChannelMember } from './chat.entity';
import { Channel } from './chat.entity';
import { Message } from './chat.entity';
// import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChannelMemberRepository extends Repository<ChannelMember> {
  constructor(private dataSource: DataSource) {
    super(ChannelMember, dataSource.createEntityManager());
  }

  async createChannelMember() {
    
  };
  // async createUser(authCreadentailsDto: AuthCreadentailsDto): Promise<void> {
  //   const { username, password } = authCreadentailsDto;

  //   const salt = await bcrypt.genSalt();
  //   const hashedPassword = await bcrypt.hash(password, salt);

  //   const user = this.create({ username, password: hashedPassword });
  //   try {
  //     await this.save(user);
  //   } catch (error) {
  //     if (error.code === '23505') {
  //       throw new ConflictException('Existing username');
  //     } else {
  //       throw new InternalServerErrorException();
  //     }
  //     // console.log('error', error);
  //   }
  // }
}

@Injectable()
export class ChannelRepository extends Repository<Channel> {
  constructor(private dataSource: DataSource) {
    super(ChannelMember, dataSource.createEntityManager());
  }

  async createChannel({name, description, owner, members, messages}: {name: string, description: string, owner: string, members: string[], messages: string[]}) {
    
  };
  // async createUser(authCreadentailsDto: AuthCreadentailsDto): Promise<void> {
  //   const { username, password } = authCreadentailsDto;

  //   const salt = await bcrypt.genSalt();
  //   const hashedPassword = await bcrypt.hash(password, salt);

  //   const user = this.create({ username, password: hashedPassword });
  //   try {
  //     await this.save(user);
  //   } catch (error) {
  //     if (error.code === '23505') {
  //       throw new ConflictException('Existing username');
  //     } else {
  //       throw new InternalServerErrorException();
  //     }
  //     // console.log('error', error);
  //   }
  // }
}

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private dataSource: DataSource) {
    super(ChannelMember, dataSource.createEntityManager());
  }

  async createMessage() {
    
  };
  // async createUser(authCreadentailsDto: AuthCreadentailsDto): Promise<void> {
  //   const { username, password } = authCreadentailsDto;

  //   const salt = await bcrypt.genSalt();
  //   const hashedPassword = await bcrypt.hash(password, salt);

  //   const user = this.create({ username, password: hashedPassword });
  //   try {
  //     await this.save(user);
  //   } catch (error) {
  //     if (error.code === '23505') {
  //       throw new ConflictException('Existing username');
  //     } else {
  //       throw new InternalServerErrorException();
  //     }
  //     // console.log('error', error);
  //   }
  // }
}
