import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import * as config from 'config';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';


async function bootstrap() {
  dotenv.config(); // .env 파일 로드
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOptions: CorsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  };
  app.enableCors(corsOptions);
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(process.env.BACKEND_PORT || 4000);
  console.log(`listening on port, ${process.env.BACKEND_PORT}`);
  
  //   if (module.hot) {
  //     module.hot.accept();
  //     module.hot.dispose(() => app.close());
  //   }
}
bootstrap();
