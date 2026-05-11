export function parseBodyParserLimit(
  value: string | undefined,
  fallback = '5mb',
): string {
  const normalized = value?.trim();

  if (!normalized) {
    return fallback;
  }

  return normalized;
}
