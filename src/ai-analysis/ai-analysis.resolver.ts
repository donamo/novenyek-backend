import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnabledUserGuard } from '../auth/guards/enabled-user.guard';
import { AiAnalysisModel } from './models/ai-analysis.model';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { AiAnalysisService } from './ai-analysis.service';

@Resolver(() => AiAnalysisModel)
@UseGuards(EnabledUserGuard)
export class AiAnalysisResolver {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Query(() => [AiAnalysisModel])
  plantAiAnalyses(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
  ) {
    return this.aiAnalysisService.findByPlant(user.id, plantId);
  }

  @Query(() => AiAnalysisModel)
  aiAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.aiAnalysisService.findOne(user.id, id);
  }

  @Mutation(() => AiAnalysisModel)
  createAiAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Args('plantId', { type: () => ID }) plantId: string,
    @Args('input') input: CreateAiAnalysisDto,
  ) {
    return this.aiAnalysisService.create(user.id, plantId, input);
  }
}
