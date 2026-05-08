import { test, expect } from '@playwright/test'

test.describe('Leave Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee
    await page.goto('/auth/signin')
    await page.fill('input[name="email"]', 'mike.johnson@company.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('should display leave page', async ({ page }) => {
    await page.goto('/dashboard/leave')
    await expect(page.locator('h1')).toContainText('Leave Management')
  })

  test('should show leave balances', async ({ page }) => {
    await page.goto('/dashboard/leave')
    await expect(page.locator('text=Balance')).toBeVisible()
  })

  test('should navigate to new leave request form', async ({ page }) => {
    await page.goto('/dashboard/leave')
    await page.click('text=New Request')
    await expect(page.locator('h1')).toContainText('New Leave Request')
  })
})
