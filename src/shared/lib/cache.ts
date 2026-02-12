const CACHE_DURATION = 2 * 60 * 1000; // 2 минуты

export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data as T;
    }

    localStorage.removeItem(`cache_${key}`);
    return null;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      `cache_${key}`,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch (error) {
    console.warn('Не удалось сохранить в кеш:', error);
  }
}

export function clearCache(pattern: string): void {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`cache_${pattern}`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Не удалось очистить кеш:', error);
  }
}
