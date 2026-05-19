import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReadOnlyPrismaService } from '../prisma/read-only-prisma.service';

type HealthStatus = 'ok' | 'error';

export type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  checks: {
    database: HealthStatus;
    readOnlyDatabase: HealthStatus;
  };
};

const HEALTH_CACHE_TTL_MS = 3000;

@Injectable()
export class SystemHealthService {
  private cachedHealth: { expiresAt: number; response: HealthResponse } | null =
    null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly readOnlyPrisma: ReadOnlyPrismaService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    const now = Date.now();

    if (this.cachedHealth && this.cachedHealth.expiresAt > now) {
      return this.cachedHealth.response;
    }

    const [database, readOnlyDatabase] = await Promise.all([
      this.checkDatabase(this.prisma),
      this.checkDatabase(this.readOnlyPrisma),
    ]);
    const response: HealthResponse = {
      status: database === 'ok' && readOnlyDatabase === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        readOnlyDatabase,
      },
    };

    this.cachedHealth = {
      expiresAt: now + HEALTH_CACHE_TTL_MS,
      response,
    };

    return response;
  }

  private async checkDatabase(client: PrismaService | ReadOnlyPrismaService) {
    try {
      await client.$queryRaw`SELECT 1`;
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
