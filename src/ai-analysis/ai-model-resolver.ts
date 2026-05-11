import { ConfigService } from '@nestjs/config';
import { AiProvider } from '@prisma/client';

export type OpenAiModelTier = 'cheap' | 'medium' | 'expensive';

const OPENAI_TIER_MODELS: Record<OpenAiModelTier, string> = {
  cheap: 'gpt-5.4-nano',
  medium: 'gpt-5.4-mini',
  expensive: 'gpt-5.5',
};

export function resolveAiModel(
  config: ConfigService,
  provider: AiProvider,
): string {
  const explicitModel = config.get<string>('AI_MODEL')?.trim();
  if (explicitModel) {
    return explicitModel;
  }

  if (provider === AiProvider.mock) {
    return 'mock-v1';
  }

  if (provider === AiProvider.openai) {
    return OPENAI_TIER_MODELS[resolveOpenAiModelTier(config)];
  }

  return 'mock-v1';
}

export function resolveOpenAiModelTier(
  config: ConfigService,
): OpenAiModelTier {
  const rawTier = config.get<string>('OPENAI_MODEL_TIER')?.trim().toLowerCase();

  if (rawTier === 'cheap' || rawTier === 'medium' || rawTier === 'expensive') {
    return rawTier;
  }

  return 'medium';
}
