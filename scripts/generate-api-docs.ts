import { GraphQLSchemaHost } from '@nestjs/graphql';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { printSchema } from 'graphql';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as YAML from 'yaml';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const outputDir = join(process.cwd(), 'docs', 'generated');

async function generate(): Promise<void> {
  process.env.DATABASE_URL ??=
    'postgresql://postgres:postgres@127.0.0.1:5432/novenyek_docs';
  process.env.PORT ??= '3000';
  process.env.UPLOAD_DIR ??= './uploads';
  process.env.AI_PROVIDER ??= 'mock';
  process.env.AI_MODEL ??= 'mock-v1';
  process.env.AI_MONTHLY_IMAGE_LIMIT ??= '30';
  process.env.AI_MAX_PHOTOS_PER_ANALYSIS ??= '3';
  process.env.AI_MAX_OUTPUT_TOKENS ??= '500';
  process.env.AI_IMAGE_MAX_SIZE ??= '1280';
  process.env.NODE_ENV ??= 'development';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      onModuleInit: () => Promise.resolve(),
      onModuleDestroy: () => Promise.resolve(),
    })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const gqlSchemaHost = app.get(GraphQLSchemaHost);
  const graphqlSchema = printSchema(gqlSchemaHost.schema);

  const openApiConfig = new DocumentBuilder()
    .setTitle('NovenyNaplo Backend API')
    .setDescription('REST API for the NövényNapló / PlantCare Log backend.')
    .setVersion('0.1.0')
    .addCookieAuth('connect.sid', { type: 'apiKey' }, 'connect.sid')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  if (
    openApiDocument.components?.schemas &&
    Object.keys(openApiDocument.components.schemas).length === 0
  ) {
    delete openApiDocument.components.schemas;
  }

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(join(outputDir, 'schema.graphql'), graphqlSchema),
    writeFile(join(outputDir, 'openapi.yaml'), YAML.stringify(openApiDocument)),
  ]);

  await app.close();
}

generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
