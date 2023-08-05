import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as config from 'config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const server = config.get('server');

  await app.listen(server.port);
  console.log(`listening on port, ${server.port}`);
}
bootstrap();
