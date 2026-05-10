import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  displayName?: string | null;

  @Field()
  isEnabled!: boolean;

  @Field()
  isAdmin!: boolean;
}
