import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PlantEventType } from '@prisma/client';

@ObjectType()
export class PlantEventModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field(() => ID)
  plantId!: string;

  @Field(() => PlantEventType)
  type!: PlantEventType;

  @Field()
  eventDate!: Date;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  createdAt!: Date;
}
