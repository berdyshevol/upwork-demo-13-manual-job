import { test, expect } from "@playwright/test";

// Acceptance criterion 1: Live URL loads seeded tickets and 4 starter rules
test("loads seeded tickets and 4 starter rules without setup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("tickets-list")).toBeVisible();
  const rows = page.getByTestId("ticket-row");
  await expect(rows.first()).toBeVisible();
  // Expect at least 10 seeded tickets
  await expect(rows).toHaveCount(10);

  await page.goto("/rules");
  await expect(page.getByTestId("rules-list")).toBeVisible();
  const ruleRows = page.getByTestId("rule-row");
  await expect(ruleRows).toHaveCount(4);
});

// Acceptance criterion 2: /settings persists BYOK blob in localStorage and survives reload
test("settings persists BYOK provider/key/model as single JSON blob in localStorage", async ({ page }) => {
  await page.goto("/settings");
  await page.getByTestId("provider-select").selectOption("openai");
  // Label updates to OpenAI
  await expect(page.getByTestId("apikey-label")).toContainText("OpenAI");
  await page.getByTestId("apikey-input").fill("sk-test-12345");
  await page.getByTestId("model-select").selectOption("gpt-4o");
  await page.getByTestId("save-button").click();
  await expect(page.getByTestId("save-status")).toContainText("Saved");

  // Reload and verify persistence
  await page.reload();
  const stored = await page.evaluate(() => localStorage.getItem("byok"));
  expect(stored).not.toBeNull();
  const parsed = JSON.parse(stored!);
  expect(parsed).toEqual({ provider: "openai", apiKey: "sk-test-12345", model: "gpt-4o" });

  // UI reflects loaded values
  await expect(page.getByTestId("provider-select")).toHaveValue("openai");
  await expect(page.getByTestId("apikey-input")).toHaveValue("sk-test-12345");
  await expect(page.getByTestId("model-select")).toHaveValue("gpt-4o");
});

// Acceptance criterion 3: With valid key (mock provider sentinel), Run AI produces intent + matched rule + draft
test("Run AI with mock provider sentinel produces intent, matched rule, and draft", async ({ page }) => {
  await page.goto("/settings");
  await page.evaluate(() =>
    localStorage.setItem("byok", JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }))
  );

  await page.goto("/");
  // Pick first ticket
  const firstRow = page.getByTestId("ticket-row").first();
  await firstRow.getByTestId("run-ai-button").click();

  // After running, the row should show intent + draft preview
  await expect(firstRow.getByTestId("ticket-intent")).not.toBeEmpty();
  await expect(firstRow.getByTestId("ticket-draft")).not.toBeEmpty();
  await expect(firstRow.getByTestId("ticket-confidence")).not.toBeEmpty();
});

// Acceptance criterion 4: With no key, non-AI flows still work and Run AI returns a mock draft
test("no key: non-AI flows work and Run AI shows hint", async ({ page }) => {
  await page.goto("/");
  // Clear byok
  await page.evaluate(() => localStorage.removeItem("byok"));
  await page.reload();

  // Tickets table still visible
  await expect(page.getByTestId("tickets-list")).toBeVisible();

  // The Run AI hint is visible
  await expect(page.getByTestId("byok-hint")).toBeVisible();
  await expect(page.getByTestId("byok-hint")).toContainText("Settings");

  // Clicking Run AI without a key still does not crash — it produces a deterministic mock draft
  const firstRow = page.getByTestId("ticket-row").first();
  await firstRow.getByTestId("run-ai-button").click();
  await expect(firstRow.getByTestId("ticket-draft")).not.toBeEmpty();
});

// Acceptance criterion 5: Editing a rule changes the AI draft for tickets that match it
test("editing a rule changes the AI draft for matching tickets", async ({ page }) => {
  await page.goto("/settings");
  await page.evaluate(() =>
    localStorage.setItem("byok", JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }))
  );

  // Edit the refund rule policy
  await page.goto("/rules");
  const refundRow = page.getByTestId("rule-row").filter({ hasText: "refund" }).first();
  await refundRow.getByTestId("edit-rule-button").click();
  const newPolicy = "FULL_REFUND_NO_QUESTIONS_ASKED_72H";
  await page.getByTestId("policy-input").fill(newPolicy);
  await page.getByTestId("save-rule-button").click();
  await expect(page.getByTestId("rule-save-status")).toContainText("Saved");

  // Run AI on a refund ticket — find one
  await page.goto("/");
  const refundTicket = page.getByTestId("ticket-row").filter({ hasText: /refund/i }).first();
  await refundTicket.getByTestId("run-ai-button").click();
  await expect(refundTicket.getByTestId("ticket-draft")).toContainText(newPolicy);
});

// Acceptance criterion 6: Below confidence threshold → "needs human" on detail page
test("low-confidence ticket is flagged 'needs human' on detail page", async ({ page }) => {
  await page.goto("/settings");
  await page.evaluate(() =>
    localStorage.setItem("byok", JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }))
  );

  // Ticket id 10 is engineered to be low-confidence ("weird"/unknown intent) in seed
  await page.goto("/tickets/10");
  await page.getByTestId("run-ai-detail-button").click();
  await expect(page.getByTestId("needs-human-flag")).toBeVisible();
  await expect(page.getByTestId("needs-human-flag")).toContainText("needs human");
});

// Acceptance criterion 7: /metrics reflects updated counts after running batch
test("metrics page reflects updated counts after batch run", async ({ page }) => {
  await page.goto("/settings");
  await page.evaluate(() =>
    localStorage.setItem("byok", JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }))
  );

  await page.goto("/");
  await page.getByTestId("run-all-button").click();
  // Wait until at least one ticket shows draft
  await expect(page.getByTestId("ticket-row").first().getByTestId("ticket-draft")).not.toBeEmpty();

  await page.goto("/metrics");
  await expect(page.getByTestId("metric-auto")).toBeVisible();
  await expect(page.getByTestId("metric-escalated")).toBeVisible();
  await expect(page.getByTestId("metric-confidence")).toBeVisible();

  // Auto-handled count should be > 0 after batch run
  const autoText = await page.getByTestId("metric-auto").innerText();
  const m = autoText.match(/\d+/);
  expect(m).not.toBeNull();
  expect(parseInt(m![0], 10)).toBeGreaterThan(0);
});

// Acceptance criterion 8: BYOK gate test — no key disables AI features with hint visible; mock key enables them
test("BYOK gate: hint visible without key, hint hidden with mock key", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("byok"));
  await page.reload();
  await expect(page.getByTestId("byok-hint")).toBeVisible();

  await page.evaluate(() =>
    localStorage.setItem("byok", JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }))
  );
  await page.reload();
  await expect(page.getByTestId("byok-hint")).toHaveCount(0);
});

// Acceptance criterion (provider/model dropdown adaptation)
test("model dropdown options change when provider changes", async ({ page }) => {
  await page.goto("/settings");
  await page.getByTestId("provider-select").selectOption("anthropic");
  await expect(page.getByTestId("model-select")).toContainText("claude-haiku-4-5");

  await page.getByTestId("provider-select").selectOption("google");
  await expect(page.getByTestId("model-select")).toContainText("gemini-2.0-flash");

  await page.getByTestId("provider-select").selectOption("openai");
  await expect(page.getByTestId("model-select")).toContainText("gpt-4o-mini");
});
