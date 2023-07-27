import { Injectable } from '@nestjs/common';
import { Channel } from '../class/channel.class';
import { Mode } from '../entities/chat.entity';

@Injectable()
export class Test {
  getMockData(): any {
    // Friend 목데이터 생성
    const friend1 = { friendNickname: 'wochae', isOnline: true };
    const friend2 = { friendNickname: 'jujeon', isOnline: false };
    const friend3 = { friendNickname: 'jeekim', isOnline: true };
    const friends = [friend1, friend2, friend3];

    // Channel 목데이터 생성
    const channel1 = new Channel();
    channel1.setChannelIdx = 1;
    channel1.setRoomId = 1;
    channel1.setMode = Mode.PUBLIC;
    channel1.setOwner = 'channelOwner1';
    channel1.setPassword = null;

    const channel2 = new Channel();
    channel2.setChannelIdx = 2;
    channel2.setRoomId = 2;
    channel2.setMode = Mode.PROTECTED;
    channel2.setOwner = 'channelOwner2';
    channel2.setPassword = '1234';

    const channels = [channel1, channel2];

    // BlockList 목데이터 생성
    const blockList1 = 'block1';
    const blockList2 = 'block2';
    const blockList3 = 'block3';
    const blockList = [blockList1, blockList2, blockList3];

    // 본인 정보 목데이터 생성
    const imgUri = '본인 이미지 경로';
    const myNickname = '본인 닉네임';

    // 목데이터 반환
    return {
      friend: friends,
      channel: channels,
      blockList: blockList,
      imgUri: imgUri,
      myNickname: myNickname,
    };
  }

  // 메인 화면에 접속했을 때 호출되는 메소드
  async getMainScreenData(intra: string): Promise<any> {
    // 인메모리에서 목데이터를 가져옵니다.
    const mockData = this.getMockData();
    return mockData;
  }
}
