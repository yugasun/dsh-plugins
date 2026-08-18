export async function failOpen<T>(
  run: () => Promise<T>,
  fallback: T,
  onError: (error: unknown) => void,
  enabled: boolean,
): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (!enabled) throw error
    onError(error)
    return fallback
  }
}
