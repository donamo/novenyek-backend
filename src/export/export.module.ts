import { Module } from '@nestjs/common';
import { ExportResolver } from './export.resolver';
import { ExportService } from './export.service';

@Module({
  providers: [ExportResolver, ExportService],
})
export class ExportModule {}
