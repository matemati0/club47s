import { expect, test, type Page } from "@playwright/test";

const memberEmail = "member@club47.co.il";
const memberPassword = "club47";
const adminEmail = "admin@club47.co.il";
const adminPassword = "admin47";

async function completeTwoFactor(page: Page) {
  await expect(page.getByPlaceholder("קוד אימות בן 6 ספרות")).toBeVisible();
  const debugText = await page.getByTestId("debug-2fa-code").textContent();
  const code = debugText?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByPlaceholder("קוד אימות בן 6 ספרות").fill(code as string);
  await page.getByRole("button", { name: "אמת קוד והתחבר" }).click();
}

test("guest is redirected to login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "ברוכים הבאים למועדון" })).toBeVisible();
});

test("anonymous flow shows limited-content banner", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "המשך כאנונימי" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("אתה גולש כאנונימי – חלק מהתוכן מוגבל")).toBeVisible();
  await expect(page.getByText("סודות החשק")).toBeVisible();
  await expect(page.getByText("משלוחים ותשלום")).toBeVisible();

  await page.getByTestId("option-cialis").selectOption("1");
  await page.getByTestId("qty-cialis").selectOption("2");
  await page.getByTestId("add-cialis").click();

  await expect(page.getByTestId("cart-count")).toContainText("2");
  await expect(page.getByTestId("cart-total")).toContainText("600 ₪");
});

test("member login with email requires two-factor code", async ({ page }) => {
  await page.goto("/login");

  await page.getByPlaceholder("אימייל").fill(memberEmail);
  await page.getByPlaceholder("סיסמה").fill(memberPassword);
  await page.getByRole("button", { name: "התחבר עם אימייל" }).click();
  await completeTwoFactor(page);

  await expect(page).toHaveURL("/");
  await expect(page.getByText("הגישה המלאה שלך פעילה")).toBeVisible();
  await expect(page.getByRole("heading", { name: "עדכונים פרטיים" })).toBeVisible();
});

test("social login with gmail grants member access", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "התחבר עם Gmail" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("הגישה המלאה שלך פעילה")).toBeVisible();
});

test("registration creates member session", async ({ page }) => {
  const suffix = Date.now();
  const newEmail = `member-${suffix}@club47.co.il`;
  const newPassword = "secret123";

  await page.goto("/register");

  await page.getByPlaceholder("אימייל").fill(newEmail);
  await page.getByPlaceholder("סיסמה", { exact: true }).fill(newPassword);
  await page.getByPlaceholder("אימות סיסמה").fill(newPassword);
  await page.getByRole("button", { name: "יצירת חשבון ושליחת קוד" }).click();

  await expect(page.getByPlaceholder("קוד אימות בן 6 ספרות")).toBeVisible();
  const debugText = await page.getByTestId("register-debug-2fa-code").textContent();
  const code = debugText?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();

  await page.getByPlaceholder("קוד אימות בן 6 ספרות").fill(code as string);
  await page.getByRole("button", { name: "אמת קוד והשלם הרשמה" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("הגישה המלאה שלך פעילה")).toBeVisible();
});

test("admin login opens admin panel", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByPlaceholder("אימייל אדמין").fill(adminEmail);
  await page.getByPlaceholder("סיסמה").fill(adminPassword);
  await page.getByRole("button", { name: "כניסת אדמין" }).click();

  await expect(page.getByPlaceholder("קוד אימות בן 6 ספרות")).toBeVisible();
  const debugText = await page.getByTestId("admin-debug-2fa-code").textContent();
  const code = debugText?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();

  await page.getByPlaceholder("קוד אימות בן 6 ספרות").fill(code as string);
  await page.getByRole("button", { name: "אמת והיכנס לפאנל" }).click();

  await expect(page).toHaveURL("/admin");
  await expect(page.getByRole("heading", { name: "פאנל ניהול מלא" })).toBeVisible();
});
