import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { HumidityLevel, LightLevel, RoomOrientation } from '@prisma/client';

@ObjectType()
export class RoomCountModel {
  @Field(() => Int)
  plants!: number;
}

@ObjectType()
export class RoomModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field()
  name!: string;

  @Field(() => RoomOrientation, { nullable: true })
  orientation?: RoomOrientation | null;

  @Field(() => LightLevel, { nullable: true })
  lightLevel?: LightLevel | null;

  @Field(() => HumidityLevel, { nullable: true })
  humidityLevel?: HumidityLevel | null;

  @Field(() => String, { nullable: true })
  averageTemperature?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => RoomCountModel, { nullable: true })
  _count?: RoomCountModel;
}
