import { Module } from '@nestjs/common';
import { PlantsResolver } from './plants.resolver';
import { PlantsService } from './plants.service';

@Module({
  providers: [PlantsResolver, PlantsService],
  exports: [PlantsService],
})
export class PlantsModule {}
