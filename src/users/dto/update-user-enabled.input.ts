import { Field, ID, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

@InputType()
export class UpdateUserEnabledInput {
  @Field(() => ID)
  @ApiProperty()
  @IsString()
  id!: string;

  @Field()
  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}
