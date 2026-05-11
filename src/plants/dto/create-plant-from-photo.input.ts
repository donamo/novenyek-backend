import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

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
}
