import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PlantPhotoModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  ownerUserId!: string;

  @Field(() => ID)
  plantId!: string;

  @Field(() => ID, { nullable: true })
  statusReportId?: string | null;

  @Field()
  filePath!: string;

  @Field(() => String, { nullable: true })
  thumbnailPath?: string | null;

  @Field(() => String, { nullable: true })
  originalFilename?: string | null;

  @Field()
  mimeType!: string;

  @Field(() => Int)
  sizeBytes!: number;

  @Field(() => Int, { nullable: true })
  width?: number | null;

  @Field(() => Int, { nullable: true })
  height?: number | null;

  @Field(() => Date, { nullable: true })
  takenAt?: Date | null;

  @Field()
  uploadedAt!: Date;

  @Field(() => String, { nullable: true })
  caption?: string | null;
}
