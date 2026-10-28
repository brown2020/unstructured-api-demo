/**
 * Origin and rate-limit checks for the public parse Server Action.
 * The in-memory limiter is per server instance; it still caps accidental
 * and scripted spend of the Unstructured API key on that instance.
 */

export const PARSE_WINDOW_MS = 10 * 60 * 1000;
export const PARSE_LIMIT_PER_IP = 8;
export const PARSE_LIMIT_GLOBAL = 40;

const ORIGIN_MISSING = "Upload blocked because the request origin is missing.";
const ORIGIN_INVALID = "Upload blocked because the request origin is not allowed.";
const RATE_LIMITED = "Too many parse requests. Wait a few minutes and try again.";

export type HeaderReader = {
  get(name: string): string | null;
};

export type ParseAuthorization =
  | { ok: true }
  | { ok: false; message: string };

type HitList = number[];

export function createRateLimiter(options?: {
  perIp?: number;
  global?: number;
  windowMs?: number;
}) {
  const perIp = options?.perIp ?? PARSE_LIMIT_PER_IP;
  const globalLimit = options?.global ?? PARSE_LIMIT_GLOBAL;
  const windowMs = options?.windowMs ?? PARSE_WINDOW_MS;
  const hits = new Map<string, HitList>();

  const prune = (key: string, now: number) => {
    const kept = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
    hits.set(key, kept);
    return kept;
  };

  return {
    reset() {
      hits.clear();
    },
    tryConsume(key: string, now = Date.now()) {
      const ipHits = prune(`ip:${key}`, now);
      const globalHits = prune("global", now);
      if (ipHits.length >= perIp || globalHits.length >= globalLimit) {
        return false;
      }
      ipHits.push(now);
      globalHits.push(now);
      return true;
    },
  };
}

export const parseRateLimiter = createRateLimiter();

export function sameOriginError(headerBag: HeaderReader): string | null {
  const origin = headerBag.get("origin");
  if (!origin || origin === "null") return ORIGIN_MISSING;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return ORIGIN_INVALID;
  }

  const forwarded = headerBag.get("x-forwarded-host");
  const host = (forwarded ?? headerBag.get("host") ?? "")
    .split(",")[0]
    ?.trim()
    .toLowerCase();
  if (!host || originHost !== host) return ORIGIN_INVALID;
  return null;
}

export function clientKey(headerBag: HeaderReader): string {
  const forwarded = headerBag.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = headerBag.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function authorizeParse(
  headerBag: HeaderReader,
  now = Date.now(),
): ParseAuthorization {
  const originError = sameOriginError(headerBag);
  if (originError) return { ok: false, message: originError };
  if (!parseRateLimiter.tryConsume(clientKey(headerBag), now)) {
    return { ok: false, message: RATE_LIMITED };
  }
  return { ok: true };
}

export function resetParseGuardForTests() {
  parseRateLimiter.reset();
}
