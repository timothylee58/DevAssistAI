import { expect, test } from "@playwright/test";

test.describe("Model Selector", () => {
  test("should display Gemini Pro in the model selector", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("model-selector").click();
    const geminiPro = page.locator("text=Gemini Pro");
    await expect(geminiPro).toBeVisible();
  });
});
