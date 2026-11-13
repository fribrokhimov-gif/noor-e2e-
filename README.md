# Noor Merchant — E2E (Playwright + TypeScript)

End-to-end UI tests for the Noor merchant panel, covering the authentication flows:
**login, logout, and forgot-password**. Each test drives the real UI **and** asserts the
underlying backend contract (request/response) via network interception.

## Design
- **Page Object Model** — `src/pages/*` (login, reset-password, app shell/logout).
- **Fixtures** — `src/fixtures/test-fixtures.ts` wires page objects and a `disposableAccount`
  fixture that provisions a throwaway employee for the reset flow and cleans it up.
- **Backend helper** — `src/api/merchant-api.ts` (test-data setup/teardown only, not the SUT).
- **Network assertions** — tests capture `POST /auth/merchant`, `/auth/logout`, `/otp/send`,
  `/otp/confirm`, `/auth/merchants/set-password` and assert status + body.

## Run
```bash
npm ci
npx playwright install chromium
cp .env.example .env      # fill MERCHANT_PHONE, MERCHANT_PASSWORD, RESET_OTP
npm test                  # or: npm run test:headed / npm run report
```

The forgot-password spec needs `RESET_OTP` (the test env's fixed OTP for the virtual
`+99800XXXXXXX` numbers). Without it, that spec skips itself.

## CI
`.github/workflows/e2e.yml` runs on push/PR. Set repo secrets `MERCHANT_PHONE`,
`MERCHANT_PASSWORD`, `RESET_OTP`. The HTML report is uploaded as an artifact.

## Coverage
- **Auth** — `tests/login.spec.ts`, `tests/logout.spec.ts`, `tests/forgot-password.spec.ts`
- **Employees (Staff)** — `tests/employees.spec.ts`: add manager → list → delete; add cashier; reject no-phone
- **Addresses (Branches)** — `tests/branches.spec.ts`: an API-seeded address shows in the list and
  is deleted through the UI. Creating an address drives the **Yandex geocoder**, so that test is
  opt-in: run with `RUN_GEOCODER=1` (and optionally `ADDRESS_QUERY="..."`).

## Running on macOS (watch it)
```bash
npm ci && npx playwright install chromium
cp .env.example .env     # set MERCHANT_PHONE, MERCHANT_PASSWORD, RESET_OTP=804575
SLOWMO=800 npm run test:slow    # headed, one worker, slowed down
npm run test:ui                 # interactive runner (time-travel, pick tests)
```
