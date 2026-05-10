import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { PlantEventType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalDateField } from '../../common/dto/optional-date-field';

@InputType()
export class CreatePlantEventDto {
  @Field(() => PlantEventType)
  @ApiProperty({ enum: PlantEventType, example: PlantEventType.repotting })
  @IsEnum(PlantEventType)
  type!: PlantEventType;

  @Field(() => Date)
  @ApiProperty({ example: '2026-05-09', type: String, format: 'date' })
  @OptionalDateField()
  eventDate!: Date;

  @Field()
  @ApiProperty({ example: 'Átültetés', maxLength: 180 })
  @IsString()
  @MaxLength(180)
  title!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    example: 'Átültetve 14 cm-es cserépbe, friss bonsai földkeverékbe.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
