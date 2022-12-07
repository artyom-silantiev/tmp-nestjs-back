import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JWTAuthName } from '@share/constans';

export async function appUseSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Tmp-Nestjs')
    .setDescription(
      [
        'Example REST api<br>',
        'Default admin email: admin@example.com',
        'Default admin password: password',
      ].join('<br>'),
    )
    .setVersion('0.6.3')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      JWTAuthName, // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .setExternalDoc('Postman Collection', '/swagger-json')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
}
