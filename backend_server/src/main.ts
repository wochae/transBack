import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'config';

// declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const server = config.get('server');

  await app.listen(server.port);
  console.log(`listening on port, ${server.port}`);

  //   if (module.hot) {
  //     module.hot.accept();
  //     module.hot.dispose(() => app.close());
  //   }
}
bootstrap();
