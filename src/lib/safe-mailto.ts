const PLAIN_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** mailto href for a single address. Rejects query, header, and script payloads. */
export function safeMailtoHref(value: string): string | null {
  const trimmed = value.trim();
  if (!PLAIN_EMAIL.test(trimmed)) return null;
  return `mailto:${trimmed}`;
}
