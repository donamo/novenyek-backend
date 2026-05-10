import { ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class UpsertPlantRequirementDto {
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Világos hely, sok szórt fény.' })
  @IsOptional()
  @IsString()
  lightNeed?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    example: 'A föld ne száradjon ki teljesen, de ne álljon vízben.',
  })
  @IsOptional()
  @IsString()
  waterNeed?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Közepes vagy magasabb páratartalom.' })
  @IsOptional()
  @IsString()
  humidityNeed?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: '15-25 °C' })
  @IsOptional()
  @IsString()
  temperatureNeed?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Jó vízáteresztő bonsai földkeverék.' })
  @IsOptional()
  @IsString()
  soilNeed?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Növekedési időszakban 2-4 hetente.' })
  @IsOptional()
  @IsString()
  fertilizingNeed?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: '1-2 évente.' })
  @IsOptional()
  @IsString()
  repottingFrequency?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Levélhullás, kiszáradás, fényhiány.' })
  @IsOptional()
  @IsString()
  commonProblems?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'unknown' })
  @IsOptional()
  @IsString()
  toxicity?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: 'Saját megfigyelés' })
  @IsOptional()
  @IsString()
  source?: string;
}
