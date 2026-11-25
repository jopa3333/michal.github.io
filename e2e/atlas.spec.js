import { expect, test } from '@playwright/test';

// Atlas ćwiczeń: kafelek w Start, wyszukiwarka, karta ćwiczenia (PL + EN).

async function startPl(page) {
  await page.goto('/');
  await page.locator('#langGatePl').click();
}

test('atlas tile opens the exercise atlas and shows all 62 exercises', async ({ page }) => {
  await startPl(page);
  await page.locator('#nav-start').click();
  await expect(page.locator('[data-testid="atlas-tile"]')).toBeVisible();
  await page.locator('[data-testid="atlas-tile"]').click();

  await expect(page.locator('[data-testid="atlas-title"]')).toHaveText('📖 Atlas ćwiczeń');
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row')).toHaveCount(62);

  // Category chip filters to a single muscle group.
  await page.locator('.atlas-chip', { hasText: 'Barki' }).click();
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row')).toHaveCount(8);
  await page.locator('.atlas-chip', { hasText: 'Wszystkie' }).click();
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row')).toHaveCount(62);

  // Search narrows the list, then clears.
  await page.locator('[data-testid="atlas-search"]').fill('martwy');
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row').first()).toContainText('Martwy ciąg');
  await page.locator('[data-testid="atlas-search"]').fill('zzzz');
  await expect(page.locator('[data-testid="atlas-empty"]')).toBeVisible();
  await page.locator('[data-testid="atlas-search"]').fill('');
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row')).toHaveCount(62);
});

test('exercise card shows muscles map, schematic, tempo and sources', async ({ page }) => {
  await startPl(page);
  await page.locator('#nav-start').click();
  await page.locator('[data-testid="atlas-tile"]').click();
  await page.locator('[data-testid="atlas-search"]').fill('Przysiad ze sztangą na plecach');
  await page.locator('[data-testid="atlas-rows"] .atlas-row').first().click();

  await expect(page.locator('[data-testid="atlas-detail-name"]')).toHaveText('Przysiad ze sztangą na plecach');
  await expect(page.locator('[data-testid="atlas-body-map"]')).toBeVisible();
  const primaryFront = await page.locator('[data-testid="body-map-front"] .atlas-muscle-poly.role-primary').count();
  expect(primaryFront).toBeGreaterThan(0);
  await expect(page.locator('[data-testid="atlas-motion-schematic"]')).toBeVisible();
  await expect(page.locator('[data-testid="atlas-tempo-bar"] .atlas-tempo-cell')).toHaveCount(4);
  // Tempo 2010 z bazy treningowej jest rozkodowane w pasku.
  await expect(page.locator('[data-testid="atlas-tempo-bar"]')).toContainText('2s');
  await expect(page.locator('[data-testid="atlas-tempo-bar"]')).toContainText('1s');
  await expect(page.locator('.atlas-sources li').first()).toContainText('NSCA');
  await expect(page.locator('.atlas-detail .atlas-list-mistakes li').first()).toBeVisible();

  // Klik w mięsień na mapie wraca do listy i nakłada filtr.
  await page.locator('[data-testid="body-map-front"] polygon[data-muscle="quads"].clickable').first().click();
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row').first()).toBeVisible();
  await expect(page.locator('.atlas-muscle-filter')).toContainText('Czworogłowy');
  await page.locator('.atlas-muscle-clear').click();
  await page.locator('[data-testid="atlas-search"]').fill('');
  await expect(page.locator('[data-testid="atlas-rows"] .atlas-row')).toHaveCount(62);
});

test('atlas works in English and opens focused from the workout screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('#langGateEn').click();
  await page.locator('#nav-start').click();
  await page.locator('[data-testid="atlas-tile"]').click();
  await expect(page.locator('[data-testid="atlas-title"]')).toHaveText('📖 Exercise Atlas');
  await page.locator('[data-testid="atlas-search"]').fill('Bench');
  await page.locator('[data-testid="atlas-rows"] .atlas-row').first().click();
  await expect(page.locator('[data-testid="atlas-detail-name"]')).toHaveText('Barbell Bench Press (flat)');
  await expect(page.locator('.atlas-sources li').first()).toContainText('NSCA');
  await page.locator('.atlas-close').click();

  // W skrócie z ekranu treningu: karta ćwiczenia otwiera się od razu.
  await page.locator('#nav-workout').click();
  await page.locator('.start-hero .btn-gold').click();
  await expect(page.locator('[data-testid="atlas-info-btn"]')).toBeVisible();
  await page.locator('[data-testid="atlas-info-btn"]').click();
  await expect(page.locator('[data-testid="atlas-detail"]')).toBeVisible();
  await expect(page.locator('[data-testid="atlas-detail-name"]')).toHaveText('Barbell Back Squat');
});
