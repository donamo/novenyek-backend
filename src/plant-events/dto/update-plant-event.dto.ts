import { InputType, PartialType } from '@nestjs/graphql';
import { CreatePlantEventDto } from './create-plant-event.dto';

@InputType()
export class UpdatePlantEventDto extends PartialType(CreatePlantEventDto) {}
