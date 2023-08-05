import { Repository } from 'typeorm';
import { GameRecord } from './entity/gameRecord.entity';
import { GameChannel } from './entity/gameChannel.entity';
import { CustomRepository } from 'src/typeorm-ex.decorator';

@CustomRepository(GameRecord)
export class GameRecordRepository extends Repository<GameRecord> {}

@CustomRepository(GameChannel)
export class GameChannelRepository extends Repository<GameChannel> {}

// TODO: UX 적으로 어떤 식으로 게임에 들어가고 진행되는지 머릿속에 정리
// TODO: 게임 로직이 돌아가기 위한 하부 구조 게임 방의 최초 구조 확립
// TODO: 게임 진행 시 양쪽에서 신호가 들어오는 데, 이를 어떻게 모아서 한꺼번에 데이터를 보낼 것인가? 단순히 양 쪽에서 보낼 때마다 신호를 보내는 식으로 해결 이될 것인가?
// TODO: 지금 생각, 양쪽에서 시그널이 들어올 때까 기다리고, 한 쪽 신호가 들어오고, 다음 신호가 들어오기 전까진 시그널을 보내지 않는다. 다른 한쪽의 신호가 들어오면, 그때 이동 사항을 정리하고, 이를 프론트엔드로 보낼 준비를 해서 전달한다.
// TODO: 양쪽에서 연락이 올 때를 기다리는 구조는 심각한 결함이 있다. 키보드가 입력을 앋한 걸수도 있다.
// TODO: 따라서 키보드 입력의 다음 반영은 항상 맨 마지막에 emit을 해야 하는 것으로 생각된다.
// TODO: 그렇다면 그 전에 들어오는 공의 x,y 값, 패들의 값을 통해 승리 여부를 판단하는 로직이 들어가야 한다.
// TODO : 게임중 로직
/* 1) 데이터 수신
	2) 게임 룸 특정 
	3) 들어온 데이터 분석 -> 대상자 패들 다음 이동 위치 확정 
		- 예상 데이터가 있어야 정보의 오염을 맊을 수 있다. 정보의 위변조를 맊아야 하고, 그러려면 경로 데이터를 모두 만들어서 가지고 있어야 한다. 
		- 예상 데이터와 맞다면(예상 범주 내에 들어온다면), 사용자의 입력을 적용하여, 볼의 데이터를 다 보내준다. 
		- 패들에 볼이 맞으면, 결국 다음 경로가 지정되는 꼴이 되며, 다음 이벤트 조건이 올 때까지 경로를 예측한 데이터를 보내주면 된다. 
			- 벽에 부딪히는 경우
			- 골대(좌우면)에 부딪히는 경우
			- 현재의 패들 위치(공의 이벤트가 끝난 시점)
		- 예측 데이터는 애니메이션 시간, 경과 시간 두가지가 필요함(그래야 다음 로직 고려할 수 있음) 
*/
