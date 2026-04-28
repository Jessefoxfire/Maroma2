# Maroma Staging Preview

Local preview for the Maroma homepage prototype.

## Scripts

- `npm install`
- `npm run dev`

## Isolation Safeguards (Maroma API)

This project includes a server-only readonly Maroma API wrapper:

- `lib/maroma-readonly.ts` enforces:
  - only readonly methods (`GET`/`HEAD`)
  - blocked production hosts (`maroma.com`, `www.maroma.com`, `api.maroma.com`)
  - explicit allowlist checks via `MAROMA_ALLOWED_HOSTS`
- `app/api/maroma/catalog/route.ts` uses that wrapper for catalog reads.

### Setup

1. Copy `.env.example` to `.env.local`
2. Fill only readonly credentials
3. Point `MAROMA_API_BASE_URL` to non-production API
4. Keep production hosts in `MAROMA_BLOCKED_HOSTS`

### Verify No Production Impact

- Confirm no `NEXT_PUBLIC_` Maroma secrets exist
- Confirm `MAROMA_API_BASE_URL` is not a `maroma.com` production host
- Confirm blocked hosts include `maroma.com`, `www.maroma.com`, and `api.maroma.com`
- Test `GET /api/maroma/catalog` with a sample query
- Confirm outbound requests only target hosts in `MAROMA_ALLOWED_HOSTS`
