import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'admin@company.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard/admin')
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('input[name="email"]', 'admin@company.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Sign in to your account')).toBeVisible()
  })
})
