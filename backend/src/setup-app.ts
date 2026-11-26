import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// main.ts ve e2e testlerinin ortak kurulumu
export function setupApp(app: INestApplication) {
  // Ters vekil (nginx, Next.js sunucusu) arkasında gerçek istemci IP'sini X-Forwarded-For'dan okur;
  // hız sınırı (throttler) böylece her kullanıcıyı ayrı sayar. Sadece güvenilen vekil varsa açın.
  if (process.env.TRUST_PROXY) {
    app.getHttpAdapter().getInstance().set('trust proxy', Number(process.env.TRUST_PROXY) || true);
  }

  // Gövdede DTO'da tanımlı olmayan alanlar sessizce atılır (örn. role, stokMiktari)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3100')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Depo/Stok Yönetim API')
    .setDescription('Depo stok yönetim sistemi API dokümantasyonu')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
