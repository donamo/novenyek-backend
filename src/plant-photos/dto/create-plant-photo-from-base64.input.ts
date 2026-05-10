import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { OptionalDateField } from '../../common/dto/optional-date-field';

@InputType()
export class CreatePlantPhotoFromBase64Input {
  @Field(() => ID)
  @IsString()
  plantId!: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  statusReportId?: string;

  @Field()
  @IsString()
  imageBase64!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  originalFilename?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  caption?: string;

  @Field(() => Date, { nullable: true })
  @OptionalDateField()
  takenAt?: Date;
}
