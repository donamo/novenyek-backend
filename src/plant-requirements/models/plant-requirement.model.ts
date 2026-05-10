import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlantRequirementModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field(() => ID)
  plantId!: string;

  @Field(() => String, { nullable: true })
  lightNeed?: string | null;

  @Field(() => String, { nullable: true })
  waterNeed?: string | null;

  @Field(() => String, { nullable: true })
  humidityNeed?: string | null;

  @Field(() => String, { nullable: true })
  temperatureNeed?: string | null;

  @Field(() => String, { nullable: true })
  soilNeed?: string | null;

  @Field(() => String, { nullable: true })
  fertilizingNeed?: string | null;

  @Field(() => String, { nullable: true })
  repottingFrequency?: string | null;

  @Field(() => String, { nullable: true })
  commonProblems?: string | null;

  @Field(() => String, { nullable: true })
  toxicity?: string | null;

  @Field(() => String, { nullable: true })
  source?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
