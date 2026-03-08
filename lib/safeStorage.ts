export function parseJsonWithFallback<T>(
  value: string | null,
  fallback: T,
  isValid?: (parsed: unknown) => parsed is T
): T {
  if (!value) return fallback

  try {
    const parsed: unknown = JSON.parse(value)
    if (parsed == null) return fallback
    if (isValid && !isValid(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}
