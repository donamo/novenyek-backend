import { InputType, PartialType } from '@nestjs/graphql';
import { CreatePlantStatusReportDto } from './create-plant-status-report.dto';

@InputType()
export class UpdatePlantStatusReportDto extends PartialType(
  CreatePlantStatusReportDto,
) {}
