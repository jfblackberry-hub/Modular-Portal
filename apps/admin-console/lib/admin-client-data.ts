type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

function normalizeHeaders(headers?: HeadersInit) {
  if (!headers) {
    return '';
  }

  if (headers instanceof Headers) {
    return JSON.stringify([...headers.entries()].sort(([left], [right]) => left.localeCompare(right)));
  }

  if (Array.isArray(headers)) {
    return JSON.stringify(
      [...headers].sort(([left], [right]) => left.localeCompare(right))
    );
  }

  return JSON.stringify(
    Object.entries(headers).sort(([left], [right]) => left.localeCompare(right))
  );
}

export async function fetchAdminJsonCached<T>(
  url: string,
  options?: {
    headers?: HeadersInit;
    ttlMs?: number;
    cacheKey?: string;
  }
) {
  const ttlMs = options?.ttlMs ?? 15_000;
  const cacheKey =
    options?.cacheKey ?? `${url}::${normalizeHeaders(options?.headers)}`;
  const now = Date.now();
  const cached = responseCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const request = fetch(url, {
    cache: 'no-store',
    headers: options?.headers
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed for ${url}`);
      }

      const payload = (await response.json()) as T;
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        data: payload
      });
      inflightRequests.delete(cacheKey);
      return payload;
    })
    .catch((error) => {
      inflightRequests.delete(cacheKey);
      throw error;
    });

  inflightRequests.set(cacheKey, request);
  return request;
}

export async function mapWithConcurrency<TValue, TResult>(
  values: TValue[],
  concurrency: number,
  mapper: (value: TValue, index: number) => Promise<TResult>
) {
  if (values.length === 0) {
    return [] as TResult[];
  }

  const results = new Array<TResult>(values.length);
  const workerCount = Math.max(1, Math.min(concurrency, values.length));
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(values[currentIndex], currentIndex);
      }
    })
  );

  return results;
}
