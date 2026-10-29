# Roadmap

Punchlist for this demo. Not a commitment to build any of it.

## Next steps

1. Put a shared rate limit in front of `parseFile` before a public deploy that holds a paid Unstructured key. The current limiter is per server instance (8 calls per address and 40 calls per process, each per 10 minutes).
2. Decide whether the public demo needs a login, a shared access token, or stays open with the limiter above.
3. Add a non-gating live partition smoke job only if a secret is available. Keep it off `.github/workflows/ci.yml`. The gate must keep working with no API key.
4. Adopt TypeScript 7 when `typescript-eslint` can load it. `typescript-eslint@8.72.1` allows TypeScript `>=4.8.4 <6.1.0`, and TypeScript 7.0 does not ship the compiler API that ESLint and Next import. TypeScript 6.0.3 stays.
5. When `unstructured-client` declares a current `@modelcontextprotocol/sdk`, drop or narrow the `1.32.2` override if `npm audit` stays clean without it.
6. Add renderers for common Unstructured types that still use the default view, especially `ListItem`.

## Known bugs and limits

- The rate limit does not survive a new serverless instance and does not coordinate across instances. A script can still spend credits by hitting many isolates.
- A handcrafted client that sets `Origin` to this site's own host is treated as same-origin. The rate limit is what bounds that path. Cross-site browser calls with a different origin are rejected.
- Vercel still caps a function response at 4.5 MB. A very large partition JSON could fail after Unstructured has already parsed the file. That response size has not been measured here.
- `UNSTRUCTURED_HI_RES=true` has no switch in the UI. Unset means Auto.
- Parsed documents are kept in memory in the browser only. Refresh clears them.
- Fixture mode never runs in production, so a production host with only `UNSTRUCTURED_USE_FIXTURES=true` and no API key returns the not-configured error.

## Deployment

Vercel project linked Oct 28, 2026 (team `ignitechannel`, project `unstructured-api-demo`). Dev previews are at `unstructured-api-demo-git-dev-ignitechannel.vercel.app`. Live parsing needs `UNSTRUCTURED_API_KEY` and `UNSTRUCTURED_API_URL` set in Vercel. Those are not set yet.

## Open issues

- No GitHub issues are tracked in this pass. File follow-ups from the list above on `dev`.
- `npm audit` is clean with the existing overrides (`@modelcontextprotocol/sdk` `1.32.2`, `zod` `4.6.7`). Do not remove those overrides just to satisfy the SDK's old `<1.10` range unless a newer `unstructured-client` replaces them.
- There is no Firebase, Stripe, or AI provider in this repo. Nothing in those systems needs a deploy or a model change.
