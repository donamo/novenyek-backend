import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ID, InputType } from '@nestjs/graphql';
import { AiProvider } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateAiAnalysisDto {
  @Field(() => ID, { nullable: true })
  @ApiPropertyOptional({ example: 'status-report-id' })
  @IsOptional()
  @IsString()
  statusReportId?: string;

  @Field(() => [ID])
  @ApiProperty({
    example: ['photo-id-1', 'photo-id-2'],
    minItems: 1,
    maxItems: 3,
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  photoIds!: string[];

  @Field(() => AiProvider, { nullable: true })
  @ApiPropertyOptional({ enum: AiProvider, example: AiProvider.mock })
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ enum: ['hu'], example: 'hu' })
  @IsOptional()
  @IsIn(['hu'])
  language?: 'hu';
}
