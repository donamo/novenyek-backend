import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, InputType } from '@nestjs/graphql';
import { HumidityLevel, LightLevel, RoomOrientation } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateRoomDto {
  @Field()
  @ApiProperty({ example: 'Nappali', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @Field(() => RoomOrientation, { nullable: true })
  @ApiPropertyOptional({ enum: RoomOrientation, example: RoomOrientation.north })
  @IsOptional()
  @IsEnum(RoomOrientation)
  orientation?: RoomOrientation;

  @Field(() => LightLevel, { nullable: true })
  @ApiPropertyOptional({ enum: LightLevel, example: LightLevel.medium })
  @IsOptional()
  @IsEnum(LightLevel)
  lightLevel?: LightLevel;

  @Field(() => HumidityLevel, { nullable: true })
  @ApiPropertyOptional({ enum: HumidityLevel, example: HumidityLevel.normal })
  @IsOptional()
  @IsEnum(HumidityLevel)
  humidityLevel?: HumidityLevel;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ example: '21-24 °C', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  averageTemperature?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    example: 'Nagy ablak, közvetlen napfény nélkül.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
