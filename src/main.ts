import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // 配置CORS
  app.enableCors({
    origin: true, // 允许所有来源
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // 允许携带凭证（cookies等）
  });
  
  // 设置全局路由前缀
  app.setGlobalPrefix(configService.get('app.prefix') || '');
  
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  
  // 全局应用转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // 全局应用异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 全局应用验证管道
  app.useGlobalPipes(new ValidationPipe());

  // 设置swagger文档
  const config = new DocumentBuilder()
    .setTitle('管理后台')   
    .setDescription('管理后台接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  await app.listen(configService.get('app.port') || 3000);
}
bootstrap();
