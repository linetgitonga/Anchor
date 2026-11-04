import { test, expect } from '@playwright/test';

test('health + AI pipeline smoke', async ({ page, request }) => {
  const api = process.env.API_URL || 'http://localhost:8000';
  const h = await request.get(`${api}/api/health`);
  expect(h.ok()).toBeTruthy();
  const email = `smoke-${Date.now()}@anchor.test`;
  const reg = await request.post(`${api}/api/v1/auth/register`, {
    data: { email, password: 'pw123456' },
  });
  expect(reg.ok()).toBeTruthy();
  const token = (await reg.json()).access_token;
  const m = await request.post(`${api}/api/v1/messages`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { text: "I'll send Brian the database notes tonight." },
  });
  expect(m.ok()).toBeTruthy();
  expect((await m.json()).commitments.length).toBe(1);
  await page.goto('/');
  await expect(page.getByTestId('memory-feed')).toBeVisible();
  await expect(page.getByTestId('forecast-center')).toBeVisible();
});
