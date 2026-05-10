import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { PlantSize, PlantStatus } from '@prisma/client';
import { RoomModel } from '../../rooms/models/room.model';

@ObjectType()
export class PlantCountModel {
  @Field(() => Int)
  events!: number;

  @Field(() => Int)
  statusReports!: number;

  @Field(() => Int)
  photos!: number;

  @Field(() => Int)
  aiAnalyses!: number;
}

@ObjectType()
export class PlantModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  nickname?: string | null;

  @Field(() => String, { nullable: true })
  species?: string | null;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => PlantSize, { nullable: true })
  size?: PlantSize | null;

  @Field(() => Int, { nullable: true })
  potSizeCm?: number | null;

  @Field(() => ID, { nullable: true })
  roomId?: string | null;

  @Field(() => RoomModel, { nullable: true })
  room?: RoomModel | null;

  @Field(() => String, { nullable: true })
  locationDescription?: string | null;

  @Field(() => Date, { nullable: true })
  acquiredAt?: Date | null;

  @Field(() => String, { nullable: true })
  acquiredFrom?: string | null;

  @Field(() => PlantStatus)
  status!: PlantStatus;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => PlantCountModel, { nullable: true })
  _count?: PlantCountModel;
}
