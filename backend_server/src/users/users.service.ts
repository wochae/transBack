import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { UserObjectRepository } from './users.repository';
import { CreateUsersDto } from './dto/create-users.dto';
import { BlockTargetDto } from './dto/block-target.dto';
import { v4 as uuidv4 } from 'uuid';
import { BlockListRepository } from './blockList.repository';
import { FriendListRepository } from './friendList.repository';
import { InsertFriendDto } from './dto/insert-friend.dto';
import axios from 'axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { response } from 'express';
import { CreateCertificateDto, IntraInfoDto, JwtPayloadDto } from 'src/auth/dto/auth.dto';
import { Socket } from 'socket.io';
import { CertificateRepository } from './certificate.repository';
import { UserObject } from '../entity/users.entity';
import { CertificateObject } from '../entity/certificate.entity';
import { FriendList } from '../entity/friendList.entity';
import { DataSource } from 'typeorm';


const intraApiMyInfoUri = 'https://api.intra.42.fr/v2/me';
@Injectable()
export class UsersService {
  constructor(
    private dataSource: DataSource,
    private userObjectRepository: UserObjectRepository,
    private blockedListRepository: BlockListRepository,
    private friendListRepository: FriendListRepository,
    private certificateRepository: CertificateRepository,
  ) { }


  private logger: Logger = new Logger('UsersService');

  async findOneUser(userIdx: number): Promise<UserObject> {
    return this.userObjectRepository.findOneBy({ userIdx });
  }

  async getTokenInfo(accessToken: string) {
    return await this.certificateRepository.findOneBy({ token: accessToken });
  }
  async saveToken(createCertificateDto: CreateCertificateDto): Promise<CertificateObject> {
    return await this.certificateRepository.save(createCertificateDto);
  };



  async blockTarget(
    blockTarget: BlockTargetDto,
    user: UserObject,
  ): Promise<string> {
    return this.blockedListRepository.blockTarget(
      blockTarget,
      user,
      this.userObjectRepository,
    );
  }

  async findUserByIntra(intra: string): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { intra: intra } });
  }

  async addFriend(
    insertFriendDto: InsertFriendDto,
    user: UserObject,
  ): Promise<FriendList[]> {
    return this.friendListRepository.insertFriend(
      insertFriendDto,
      user,
      this.userObjectRepository,
    );
  }

  async createUser(createUsersDto: CreateUsersDto): Promise<UserObject> {
    const { userIdx, intra, nickname, imgUri } = createUsersDto;

    let user = this.userObjectRepository.create({
      userIdx: userIdx,
      intra: intra,
      nickname: intra,
      imgUri: imgUri,
      rankpoint: 0,
      isOnline: true,
      available: true,
      win: 0,
      lose: 0,
    });
    user = await this.userObjectRepository.save(user);
    return user;
  }
  async validateUser(accessToken: string): Promise<UserObject> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    this.logger.log('validateUser start with token : ', accessToken);
    try {
      const response = await axios.get(intraApiMyInfoUri, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(`getIntraInfo: response.data.id : ${response.data.id}`);
      const userInfo = response.data;

      this.logger.log(`getIntraInfo: userInfo : ${userInfo.id}, ${userInfo.image.versions.small}`);
      if (!userInfo.id) {
        throw this.logger.error('인트라 정보 불러오기 실패했습니다.');
      }
      let existedUser: UserObject = await this.findOneUser(userInfo.id);
      console.log(`existedUser, userIdx :  `, existedUser);
      if (!existedUser) {
        this.logger.log('No user');
        /*
          @PrimaryColumn()
          userIdx: number;

          @Column()
          token: string;

          @Column()
          email: string

          @Column({ default: false })
          check2Auth: boolean;
         */
        const certi = await this.certificateRepository.insertCertificate(

          userInfo.id,
          accessToken, // intraInfo에 있지
          userInfo.email,
          false,

        );

        console.log('certificate insert', certi);

        this.logger.log(`user create start`);
        const user = await this.userObjectRepository.createUser({
          userIdx: response.data.id,
          intra: response.data.login,
          nickname: response.data.login,
          imgUri: response.data.image.link,
          certificate: certi,
          email: response.data.email,
        });
        console.log('user create end', user);

        try {
          await queryRunner.manager.save(certi);
          await queryRunner.manager.save(user);

          await queryRunner.commitTransaction();
        } catch (err) {
          await queryRunner.rollbackTransaction();
          console.log(err);
        } finally {
          await queryRunner.release();
        }

        return user;
      } else {
        // 유저가 존재하는 경우
        if (existedUser.certificate.token !== accessToken) {
          // 존재하는 유저가 있지만 토큰이 다른 경우 -> 토큰 업데이트
          this.logger.log('user is exist but token is different');

          existedUser.certificate.token = accessToken;
          await this.certificateRepository.update(existedUser.userIdx, existedUser.certificate);
          return existedUser;
        }
        this.logger.log(` 유저가 존재하지 않은 경우 certi insert start`);
        /*
            token: string;
            check2Auth: boolean;
            email: string;
            userIdx: number;
         */
      }

    } catch (error) {
      // 에러 핸들링
      console.error('Error making GET request:', error);
    }
  }


  async createCertificate(
    createCertificateDto: CreateCertificateDto,

  ): Promise<CertificateObject> {

    return this.certificateRepository.insertCertificate(
      createCertificateDto.userIdx,
      createCertificateDto.token,
      createCertificateDto.email,
      createCertificateDto.check2Auth,
    );
  }

  async getAllUsersFromDB(): Promise<UserObject[]> {
    return this.userObjectRepository.find();
  }

  async getUserInfoFromDB(intra: string): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { intra: intra } });
  }

  async getUserInfoFromDBById(userId: number): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { userIdx: userId } });
  }

  async getFriendList(
    intra: string,
  ): Promise<{ friendNicname: string; isOnline: boolean }[]> {
    const user: UserObject = await this.userObjectRepository.findOne({
      where: { intra: intra },
    });
    return this.friendListRepository.getFriendList(
      user.userIdx,
      this.userObjectRepository,
    );
  }

  async getBlockedList(intra: string) {
    const user: UserObject = await this.userObjectRepository.findOne({
      where: { intra: intra },
    });
    return this.blockedListRepository.getBlockedList(user);
  }

  async setIsOnline(user: UserObject, isOnline: boolean) {
    // user.isOnline = isOnline;
    return this.userObjectRepository.setIsOnline(user, isOnline);
  }

  async getUserObjectFromDB(idValue: number): Promise<UserObject> {
    return this.userObjectRepository.findOne({ where: { userIdx: idValue } });
  }

  // async getUserId(client: Socket): Promise<number> {
  //   return parseInt(client.handshake.query.userId as string, 10);
  // }
}
