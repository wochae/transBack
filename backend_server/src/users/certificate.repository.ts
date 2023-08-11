import { Repository } from 'typeorm'; // EntityRepository 가 deprecated 되어 직접 호출함
import { CustomRepository } from 'src/typeorm-ex.decorator';
import { UserObject } from 'src/entity/users.entity';
import { CertificateObject } from 'src/entity/certificate.entity';
import { CreateCertificateDto } from './dto/create-certification.dto';

@CustomRepository(CertificateObject)
export class CertificateRepository extends Repository<CertificateObject> {
  async insertCertificate(
    userIdx: number,
    token: string,
    email: string,
    check2Auth: boolean,
    
  ){
    const certificate = this.create({
      userIdx: userIdx,
      token: token,
      email: email,
      check2Auth: check2Auth,
    });
    console.log( 'cert Repo certificate : ', certificate)

    const auth = await this.save(certificate);
    console.log( 'cert Repo auth : ', auth)
    return auth;
  }
}
