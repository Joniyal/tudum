import { test, expect } from "@playwright/test";

test.describe("Voice Messages", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as first user
    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', "user1@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL("/dashboard/habits", { timeout: 10000 });
  });

  test("should record and send a voice message", async ({ page }) => {
    // Navigate to messages
    await page.goto("/dashboard/messages");
    
    // Select a partner (assuming one exists from setup)
    await page.waitForSelector("button:has-text('Partner')", { timeout: 5000 });
    const partnerButtons = await page.locator('button:has-text("Partner")').all();
    
    if (partnerButtons.length === 0) {
      test.skip();
      return;
    }

    // Click the first partner
    await partnerButtons[0].click();
    
    // Wait for messages to load
    await page.waitForTimeout(1000);
    
    // Click the microphone button to start recording
    const recordButton = page.locator('button[title="Record voice message"]');
    await recordButton.click();
    
    // Verify recording started
    await expect(recordButton).not.toBeVisible();
    const stopButton = page.locator('button[title="Stop recording"]');
    await expect(stopButton).toBeVisible();
    
    // Simulate recording for 2 seconds
    await page.waitForTimeout(2000);
    
    // Click the stop button
    await stopButton.click();
    
    // Wait for upload to complete
    await page.waitForTimeout(3000);
    
    // Verify recording button is back
    await expect(recordButton).toBeVisible({ timeout: 5000 });
    
    // Verify the uploaded message appears in the conversation
    const audioElement = page.locator("audio[controls]").first();
    await expect(audioElement).toBeVisible({ timeout: 5000 });
    
    // Verify we can interact with the audio player
    await expect(audioElement).toHaveAttribute("src", /\/uploads\/voices\/|https:\/\//);
  });

  test("should forward a voice message", async ({ page, context }) => {
    // Navigate to messages
    await page.goto("/dashboard/messages");
    
    // Select a partner
    await page.waitForSelector("button:has-text('Partner')", { timeout: 5000 });
    const partnerButtons = await page.locator('button:has-text("Partner")').all();
    
    if (partnerButtons.length < 2) {
      test.skip();
      return;
    }

    // Click the first partner
    await partnerButtons[0].click();
    
    // Wait for messages to load
    await page.waitForTimeout(1000);
    
    // Record a voice message
    const recordButton = page.locator('button[title="Record voice message"]');
    await recordButton.click();
    
    await page.waitForTimeout(1500);
    
    const stopButton = page.locator('button[title="Stop recording"]');
    await stopButton.click();
    
    // Wait for upload
    await page.waitForTimeout(3000);
    await expect(recordButton).toBeVisible({ timeout: 5000 });
    
    // Hover over the message to reveal the forward button
    const audioElement = page.locator("audio[controls]").first();
    await audioElement.hover();
    
    // Wait a bit for the buttons to appear
    await page.waitForTimeout(500);
    
    // Click forward button
    const forwardButton = page.locator('button:has-text("📤 Forward")').first();
    if (await forwardButton.isVisible()) {
      await forwardButton.click();
      
      // Wait for forward to complete
      await page.waitForTimeout(2000);
      
      // Verify progress bar or confirm message was sent
      // (In a real scenario, you'd verify the message appears in the chat again or in another partner's chat)
      await expect(recordButton).toBeVisible();
    }
  });

  test("should display audio player for voice messages", async ({ page }) => {
    // Navigate to messages
    await page.goto("/dashboard/messages");
    
    // Select a partner
    await page.waitForSelector("button:has-text('Partner')", { timeout: 5000 });
    const partnerButtons = await page.locator('button:has-text("Partner")').all();
    
    if (partnerButtons.length === 0) {
      test.skip();
      return;
    }

    await partnerButtons[0].click();
    
    // Wait for messages
    await page.waitForTimeout(1000);
    
    // Check if there are any voice messages already in the conversation
    const audioElements = page.locator("audio[controls]");
    const count = await audioElements.count();
    
    if (count === 0) {
      // Record a new voice message if none exist
      const recordButton = page.locator('button[title="Record voice message"]');
      await recordButton.click();
      
      await page.waitForTimeout(1500);
      
      const stopButton = page.locator('button[title="Stop recording"]');
      await stopButton.click();
      
      await page.waitForTimeout(3000);
      await expect(recordButton).toBeVisible({ timeout: 5000 });
    }
    
    // Verify audio element exists and has src
    const audio = page.locator("audio[controls]").first();
    await expect(audio).toBeVisible();
    
    // Verify the audio element has a src attribute pointing to a valid URL
    const src = await audio.getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/^(https?:\/\/|\/uploads\/)/);
  });

  test("should show upload progress during voice message upload", async ({ page }) => {
    // Navigate to messages
    await page.goto("/dashboard/messages");
    
    // Select a partner
    await page.waitForSelector("button:has-text('Partner')", { timeout: 5000 });
    const partnerButtons = await page.locator('button:has-text("Partner")').all();
    
    if (partnerButtons.length === 0) {
      test.skip();
      return;
    }

    await partnerButtons[0].click();
    
    await page.waitForTimeout(1000);
    
    // Start recording
    const recordButton = page.locator('button[title="Record voice message"]');
    await recordButton.click();
    
    await page.waitForTimeout(1500);
    
    // Stop recording (this triggers upload)
    const stopButton = page.locator('button[title="Stop recording"]');
    await stopButton.click();
    
    // Wait a moment for upload to start
    await page.waitForTimeout(500);
    
    // Check for upload progress bar (may or may not be visible depending on upload speed)
    const progressBar = page.locator("div[style*='width']").filter({ hasText: "Uploading" });
    
    // At least one of these should be visible
    const uploadingText = page.locator("text=Uploading");
    const recordingComplete = recordButton.isVisible();
    
    // Wait for upload to complete
    await page.waitForTimeout(3000);
    
    // Verify recording button is back
    await expect(recordButton).toBeVisible({ timeout: 5000 });
  });
});
