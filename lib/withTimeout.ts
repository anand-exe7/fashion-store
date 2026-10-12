// ============================================================
// A ceiling on how long the storefront waits for data.
//
// A request that FAILS rejects, and every page already handles that.
// A request that simply never answers — a phone that loses signal
// mid-flight, a stalled connection — does neither: it sits open, the
// promise never settles, and the page's spinner runs forever with no
// error and no way back. supabase-js sets no timeout of its own.
//
// This races the work against a clock so that case ends in a visible
// "couldn't load, retry" instead of a dead page.
// ============================================================

/** How long a storefront page waits before giving up and offering Retry. */
export const LOAD_TIMEOUT_MS = 15_000;

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export const isTimeout = (err: unknown): err is TimeoutError =>
  err instanceof TimeoutError || (err as { name?: string })?.name === 'TimeoutError';

/**
 * Resolve with `work`, or reject with TimeoutError once `ms` has passed.
 *
 * The underlying request isn't cancelled — supabase-js gives us no handle to
 * abort it — so a late answer is simply ignored. The timer is always cleared,
 * so a fast response leaves nothing pending behind it.
 */
export function withTimeout<T>(work: Promise<T>, ms: number = LOAD_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const clock = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });

  return Promise.race([work, clock]).finally(() => clearTimeout(timer)) as Promise<T>;
}
