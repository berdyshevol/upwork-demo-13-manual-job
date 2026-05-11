# AI Helpdesk Guidance Studio (demo)

## Live demo

https://upwork-demo-13-manual-job.vercel.app


A small Next.js prototype that shows raw ecommerce support tickets being
auto-classified and answered by an AI agent using editable, versioned
guidance rules.

## What it demonstrates

- Seeded inbox of 10 ecommerce tickets (order status, refund, cancellation, shipping)
- Rules editor with 4 starter guidance cards (intent, policy, tone, example reply)
- "Run AI" on a single ticket or the whole batch
- Side-by-side ticket detail: original message + matched rule + drafted reply + confidence + "needs human" flag
- Metrics page: auto-handled vs escalated vs average confidence
- BYOK settings: pick Anthropic / OpenAI / Google, paste your own API key, pick a model. Key stored only in `localStorage.byok`; calls go browser-direct via the Vercel AI SDK.
- Mock mode (no key required): deterministic drafts, no network calls

## Run locally

```bash
pnpm install
pnpm exec playwright install --with-deps chromium  # only needed for tests
pnpm dev                                            # http://localhost:3000
```

## Deploy

Deployed on Vercel. **Deploy URL:** _placeholder — set after first deploy_.

## Tests

```bash
pnpm test
```

Behavioural Playwright tests cover every PRD acceptance criterion using a
`mock` provider sentinel (`localStorage.byok = {provider:'mock',...}`) so no
real API keys are required in CI.
