import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AiConfidence, AiProvider } from '@prisma/client';

@ObjectType()
export class AiAnalysisModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field(() => ID)
  plantId!: string;

  @Field(() => ID, { nullable: true })
  statusReportId?: string | null;

  @Field(() => AiProvider)
  provider!: AiProvider;

  @Field()
  model!: string;

  @Field()
  promptVersion!: string;

  @Field(() => [String])
  inputPhotoIds!: string[];

  @Field()
  rawResponseJson!: string;

  @Field()
  summary!: string;

  @Field(() => [String])
  recommendations!: string[];

  @Field(() => AiConfidence, { nullable: true })
  confidence?: AiConfidence | null;

  @Field()
  createdAt!: Date;
}
