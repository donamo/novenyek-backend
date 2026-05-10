import { ApiPropertyOptional } from '@nestjs/swagger';
import { OptionalDateField } from '../../common/dto/optional-date-field';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadPlantPhotoDto {
  @ApiPropertyOptional({ example: 'status-report-id' })
  @IsOptional()
  @IsString()
  statusReportId?: string;

  @ApiPropertyOptional({ example: 'Május havi állapotfotó.', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  caption?: string;

  @ApiPropertyOptional({ example: '2026-05-09', type: String, format: 'date' })
  @OptionalDateField()
  takenAt?: Date;
}
