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
export class CreatePlantFromPhotoInput {
  @Field()
  @ApiProperty({
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...',
  })
  @IsString()
  imageBase64!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'plant.jpg' })
  @IsOptional()
  @IsString()
  originalFilename?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Első referenciafotó a növényről.' })
  @IsOptional()
  @IsString()
  caption?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Szobafikusz', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Gumi', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nickname?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Ficus elastica', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  species?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'szobanoveny', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @Field(() => PlantSize, { nullable: true })
  @ApiPropertyOptional({ enum: PlantSize, example: PlantSize.medium })
  @IsOptional()
  @IsEnum(PlantSize)
  size?: PlantSize;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional({ example: 17, minimum: 1, maximum: 200 })
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
    example: 'Keleti ablak mellett.',
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
  @ApiPropertyOptional({ example: 'Elso kep alapjan letrehozva.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
