import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  const x = {
    a: 1,
    b: 2,
    c: {
      abc: {
        a: 1,
        b: 2,
        c: 3,
      },
    },
  };
}

bootstrap();
