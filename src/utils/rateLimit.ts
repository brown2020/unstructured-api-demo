interface RateLimitResponse {
  success: boolean;
  remaining?: number;
  reset?: Date;
}

const REQUESTS_PER_MINUTE = 10;
const requests = new Map<string, number[]>();

export async function rateLimit(
  identifier: string
): Promise<RateLimitResponse> {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute ago

  // Get existing requests and filter out old ones
  const existing = requests.get(identifier) || [];
  const recent = existing.filter((time) => time > windowStart);

  if (recent.length >= REQUESTS_PER_MINUTE) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(recent[0] + 60000),
    };
  }

  recent.push(now);
  requests.set(identifier, recent);

  return {
    success: true,
    remaining: REQUESTS_PER_MINUTE - recent.length,
  };
}
