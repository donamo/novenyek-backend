import { InputType, PartialType } from '@nestjs/graphql';
import { CreatePlantDto } from './create-plant.dto';

@InputType()
export class UpdatePlantDto extends PartialType(CreatePlantDto) {}
