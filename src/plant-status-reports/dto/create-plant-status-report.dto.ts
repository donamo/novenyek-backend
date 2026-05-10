import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { OverallStatus, PestSuspicion } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreatePlantStatusReportDto {
  @Field()
  @ApiProperty({ example: '2026-05', pattern: '^\\d{4}-\\d{2}$' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  reportMonth!: string;

  @Field(() => OverallStatus, { nullable: true })
  @ApiPropertyOptional({ enum: OverallStatus, example: OverallStatus.medium })
  @IsOptional()
  @IsEnum(OverallStatus)
  overallStatus?: OverallStatus;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Néhány alsó levél sárgul.' })
  @IsOptional()
  @IsString()
  leafStatus?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Látható új hajtás nincs.' })
  @IsOptional()
  @IsString()
  growthStatus?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    example: 'Felszínen száraz, mélyebben enyhén nedves.',
  })
  @IsOptional()
  @IsString()
  soilStatus?: string;

  @Field(() => PestSuspicion, { nullable: true })
  @ApiPropertyOptional({ enum: PestSuspicion, example: PestSuspicion.none })
  @IsOptional()
  @IsEnum(PestSuspicion)
  pestSuspicion?: PestSuspicion;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Öntözés megfelelőnek tűnik.' })
  @IsOptional()
  @IsString()
  wateringAssessment?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Több szórt fényt kaphatna.' })
  @IsOptional()
  @IsString()
  lightAssessment?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Az ablakhoz közelebb lett téve.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'A növény állapota közepesnek tűnik.' })
  @IsOptional()
  @IsString()
  aiSummary?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Ellenőrizd a föld nedvességét.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  aiRecommendations?: string;
}
