import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class SystemResolver {
  @Query(() => String)
  apiStatus(): string {
    return 'ok';
  }
}
