import { Module } from '@nestjs/common';
import { SystemHealthService } from './system-health.service';
import { SystemController } from './system.controller';
import { SystemResolver } from './system.resolver';

@Module({
  controllers: [SystemController],
  providers: [SystemResolver, SystemHealthService],
})
export class SystemModule {}
