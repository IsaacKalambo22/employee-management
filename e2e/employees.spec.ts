import { test, expect } from '@playwright/test'

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR admin
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'john.smith@company.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard/hr')
  })

  test('should display employee list', async ({ page }) => {
    await page.goto('/dashboard/employees')
    await expect(page.locator('h1')).toContainText('Employees')
  })

  test('should navigate to employee detail page', async ({ page }) => {
    await page.goto('/dashboard/employees')
    await page.click('text=View', { timeout: 5000 })
    await expect(page.locator('h1')).toContainText('Employee Profile')
  })

  test('should search employees', async ({ page }) => {
    await page.goto('/dashboard/employees')
    await page.fill('input[placeholder*="Search"]', 'John')
    await page.press('input[placeholder*="Search"]', 'Enter')
    await expect(page.locator('text=John')).toBeVisible()
  })
})
