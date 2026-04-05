import { expect, test } from '@playwright/test'

test('user can start a project and land on the interview page', async ({ page }) => {
  await page.route('**/api/projects', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
      return
    }

    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, project_id: 123 }),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/projects/123', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: {
          id: 123,
          title: 'Test Memory Book',
          subtitle: 'A family story',
          subject_name: 'Hong Gil Dong',
          relationship_type: '부모님',
          status: 'writing',
          page_count: null,
          order_uid: null,
          cover_image_url: null,
          share_token: null,
        },
        chapters: [{ id: 1, title: '첫 장', order_index: 1 }],
        qnas: [
          {
            id: 1,
            chapter_title: '첫 장',
            chapter_order: 1,
            question: '가장 먼저 떠오르는 기억은 무엇인가요?',
            hint: '',
            placeholder: '',
            answer: '',
            time_period: '',
            skipped: false,
            photos: [],
          },
        ],
        cover_photo: null,
      }),
    })
  })

  await page.goto('/')
  await page.locator('a[href="/projects/new"]').first().click()

  await page.locator('input[name="subject_name"]').fill('Hong Gil Dong')
  await page.locator('input[name="title"]').fill('Test Memory Book')
  await page.locator('input[name="subtitle"]').fill('A family story')
  await page.locator('button[type="submit"]').click()

  await expect(page).toHaveURL(/\/projects\/123\/interview$/)
  await expect(page.locator('textarea')).toBeVisible()
})
