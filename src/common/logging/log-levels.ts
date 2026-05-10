import { LogLevel } from '@nestjs/common';

const orderedLogLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

export function resolveLogLevels(level?: string): LogLevel[] | false {
  const normalized = level?.trim().toLowerCase() ?? 'log';

  if (normalized === 'silent' || normalized === 'off' || normalized === 'none') {
    return false;
  }

  const index = orderedLogLevels.indexOf(normalized as LogLevel);

  if (index === -1) {
    return ['error', 'warn', 'log'];
  }

  return orderedLogLevels.slice(0, index + 1);
}
