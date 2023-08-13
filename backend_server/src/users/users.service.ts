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
import { CreateCertificateDto, IntraSimpleInfoDto, JwtPayloadDto } from 'src/auth/dto/auth.dto';
import { Socket } from 'socket.io';
import { CertificateRepository } from './certificate.repository';
import { UserObject } from '../entity/users.entity';
import { CertificateObject } from '../entity/certificate.entity';
import { FriendList } from '../entity/friendList.entity';
import { DataSource } from 'typeorm';
import { IntraInfoDto, UserEditImgDto, UserEditprofileDto, } from './dto/user.dto';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';


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
    console.log("찾는다: " + userIdx );
    return this.userObjectRepository.findOneBy({ userIdx });
  }

  async updateUserNick(updateUsersDto: UserEditprofileDto) {
    const { userIdx, userNickname } = updateUsersDto;
    const user = await this.userObjectRepository.findOneBy({ userIdx });
    console.log("updateOneUser: user : ", user);
    if (!user) { throw new BadRequestException('유저가 존재하지 않습니다.'); }
    if (user.nickname === userNickname) { // 요청한 닉네임이 현재 닉네임과 다르다면
      const isNicknameExist = await this.userObjectRepository.findOneBy({ nickname: userNickname });
      if (!isNicknameExist) { // 닉네임이 존재하지 않는다면
        user.nickname = userNickname;
        await this.userObjectRepository.save(user);
      } else { return false; } // 닉네임이 이미 존재한다면
    } else { return new BadRequestException('변경을 실패 했습니다.'); } // 닉네임이 같다면
  }

  async uploadUserImg(UserEditprofileDto : UserEditprofileDto) {
    const { userIdx, imgUri } = UserEditprofileDto;
    const user = await this.userObjectRepository.findOneBy({ userIdx });
    if (!user) { throw new BadRequestException('유저가 존재하지 않습니다.'); }
    const foundImgUri = user.imgUri; // 일단은 그냥 같게 함.
    // await this.findUserImg(userIdx);
    if (user.imgUri === foundImgUri) { // imgUri를 저장할 경로를 만들고 그 안에 이미지 파일을 생성해야 함.
      user.imgUri = imgUri;
      const changedUser = await this.userObjectRepository.save(user);
      return changedUser;
    } else {
      return new BadRequestException('변경을 실패 했습니다.');
    }
  }
  async getTokenInfo(accessToken: string) {
    return await this.certificateRepository.findOneBy({ token: accessToken });
  }
  async saveToken(createCertificateDto: CreateCertificateDto): Promise<CertificateObject> {
    try {
      let beforeSaveToken = await this.certificateRepository.findOneBy({ userIdx: createCertificateDto.userIdx });
      // 없다면
      if (!beforeSaveToken) { return await this.certificateRepository.save(createCertificateDto);
      } else {
        // 있다면 다른지
        if (beforeSaveToken.token != createCertificateDto.token) {
          await this.certificateRepository.update(beforeSaveToken.userIdx, createCertificateDto);
          // 다르다면 업데이트
          return await this.certificateRepository.findOneBy({ userIdx: createCertificateDto.userIdx });
        } else { return beforeSaveToken; } // 같다면 그대로
      }
    } catch (e) { console.log("토큰 디비에 문제가 있다."); throw new InternalServerErrorException(e);}
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
    const { userIdx, intra, imgUri } = createUsersDto;

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
  async validateUser(accessToken: string): Promise<IntraSimpleInfoDto> {
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
          this.logger.log(`user create start`);
          const user = await this.userObjectRepository.createUser({
            userIdx: userInfo.id,
            intra: response.data.login,
            nickname: response.data.login,
            imgUri: response.data.image.link,
            email: response.data.email,
          });
          console.log('user create end', user);
          
        const certi = await this.certificateRepository.insertCertificate(
          userInfo.id,
          accessToken,
          userInfo.email,
          false,
        );

        console.log('certificate insert : ', certi);

        user.certificate = certi;

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
        
        return new IntraSimpleInfoDto(user.userIdx, user.imgUri);;
      } else {
        // 유저가 존재하는 경우
        const userCerti = await this.certificateRepository.findOneBy({ userIdx: existedUser.userIdx });
        if (!(userCerti.token !== accessToken)) {
          // 존재하는 유저가 있지만 토큰이 다른 경우 -> 토큰 업데이트
          this.logger.log('user is exist but token is different');

          this.logger.log(` 유저가 존재하지 않은 경우 certi insert start`);
          userCerti.token = accessToken;
          await this.certificateRepository.update(userCerti.userIdx, userCerti);
          return new IntraSimpleInfoDto(existedUser.userIdx, existedUser.imgUri);
        } // 존재하는 유저가 있고 토큰이 같은 경우 -> 그대로
        return new IntraSimpleInfoDto(existedUser.userIdx, existedUser.imgUri);


        /*
            token: string;
            check2Auth: boolean;
            email: string;
            userIdx: number;
         */
      }

    } catch (error) {
      // 에러 핸들링
      console.error('Error making about cerification - ', error);
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
