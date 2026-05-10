import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLFormattedError } from 'graphql';
import { join } from 'node:path';
import './common/graphql/register-enums';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './export/export.module';
import { PlantEventsModule } from './plant-events/plant-events.module';
import { PlantPhotosModule } from './plant-photos/plant-photos.module';
import { PlantRequirementsModule } from './plant-requirements/plant-requirements.module';
import { PlantStatusReportsModule } from './plant-status-reports/plant-status-reports.module';
import { PlantsModule } from './plants/plants.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { SystemModule } from './system/system.module';
import { UsersModule } from './users/users.module';

const graphqlLogger = new Logger('GraphQL');

const logGraphQLError = (
  error: GraphQLFormattedError,
): GraphQLFormattedError => {
  const code =
    typeof error.extensions?.code === 'string'
      ? error.extensions.code
      : 'unknown';
  const path = error.path?.join('.') ?? 'unknown';
  const message = `GraphQL error code=${code} path=${path}: ${error.message}`;

  if (code === 'UNAUTHENTICATED' || code === 'FORBIDDEN') {
    graphqlLogger.warn(message);
    return error;
  }

  graphqlLogger.error(message);
  return error;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'docs/generated/schema.graphql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      formatError: logGraphQLError,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SystemModule,
    RoomsModule,
    PlantsModule,
    PlantRequirementsModule,
    PlantEventsModule,
    PlantStatusReportsModule,
    PlantPhotosModule,
    AiAnalysisModule,
    DashboardModule,
    ExportModule,
  ],
})
export class AppModule {}
