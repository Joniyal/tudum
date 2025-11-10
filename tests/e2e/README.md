# Voice Message E2E Tests

This directory contains end-to-end tests for the voice messaging feature using Playwright.

## Setup

The tests are configured in `playwright.config.ts` and test files are in `tests/e2e/`.

### Prerequisites
- Node.js installed
- Application dependencies installed: `npm install`
- A running local development server (tests will start it automatically)

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run a specific test file
```bash
npx playwright test tests/e2e/voice-messages.spec.ts
```

### Run tests in a specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Coverage

The voice message tests cover:

1. **Record and Send Voice Message**
   - Starts recording via microphone
   - Records for ~2 seconds
   - Stops recording and uploads
   - Verifies audio player appears in conversation

2. **Forward Voice Message**
   - Records and sends a voice message
   - Hovers over message to reveal action buttons
   - Clicks forward button
   - Verifies message is forwarded

3. **Audio Player Display**
   - Verifies audio element renders with controls
   - Checks that src attribute points to valid URL (local or S3)

4. **Upload Progress**
   - Records and sends a voice message
   - Verifies upload progress indicator displays
   - Confirms message is received after upload completes

## Prerequisites for Tests

The tests assume:
- Application is running on `http://localhost:3000`
- Test user exists with email `user1@example.com` and password `password123`
- At least two users/partners exist in the database for the forward message test
- Partners are connected and can message each other

## Debug Mode

To run tests with debug output:
```bash
npx playwright test --debug
```

This opens the Playwright Inspector which allows you to step through the test.

## Troubleshooting

### Tests fail with "Timeout waiting for selector"
- Ensure the dev server is running on `http://localhost:3000`
- Check that database is seeded with test users
- Increase timeout in tests if the app is slow

### Audio player not appearing
- Check browser console for JavaScript errors
- Verify the upload actually succeeded (check server logs)
- Ensure S3 is configured correctly or local `/uploads` directory exists

### Forward button not clicking
- The forward button appears on hover; test waits 500ms for it
- Increase wait time if tests are flaky

## Viewing Test Results

After tests run, view results:
```bash
npx playwright show-report
```

This opens an HTML report showing passed/failed tests and traces.

## Adding New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Use the existing test structure as a template
3. Run with `npm run test:e2e` or use `--ui` for development

Example:
```typescript
test("my new test", async ({ page }) => {
  await page.goto("/dashboard/messages");
  // ... test code
});
```

## CI/CD Integration

For GitHub Actions or other CI systems, add to your workflow:

```yaml
- name: Install dependencies
  run: npm install

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Notes

- Tests use the same authentication system as the app (NextAuth)
- Browser context includes authentication cookies after login
- Tests are independent and can run in parallel
- WebServer is auto-started from `dev` script and reused between test runs
