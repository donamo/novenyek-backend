import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { PlantSize, PlantStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OptionalDateField } from '../../common/dto/optional-date-field';

@InputType()
export class CreatePlantDto {
  @Field()
  @ApiProperty({ example: 'Zelkova bonsai', maxLength: 160 })
  @IsString()
  @MaxLength(160)
  name!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Bonsai', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nickname?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Zelkova serrata', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  species?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'bonsai', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @Field(() => PlantSize, { nullable: true })
  @ApiPropertyOptional({ enum: PlantSize, example: PlantSize.small })
  @IsOptional()
  @IsEnum(PlantSize)
  size?: PlantSize;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ example: 14, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  potSizeCm?: number;

  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ example: 'room-id' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    example: 'Északi ablak közelében.',
    maxLength: 240,
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  locationDescription?: string;

  @Field(() => Date, { nullable: true })
  @ApiPropertyOptional({ example: '2026-05-09', type: String, format: 'date' })
  @OptionalDateField()
  acquiredAt?: Date;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'kertészet', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  acquiredFrom?: string;

  @Field(() => PlantStatus, { nullable: true })
  @ApiPropertyOptional({ enum: PlantStatus, example: PlantStatus.active })
  @IsOptional()
  @IsEnum(PlantStatus)
  status?: PlantStatus;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Első bonsai növény.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
