import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Issue #118: the repository's own sample scan, whose chairs carry RoomPlan `attributes`, failed to import from
// the Build tab with "could not be cloned", because the dialog held the parsed file in deep reactive state.
const samplePath = resolve('test-roomplan.json');

async function importSample(page: Page, target: string) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Import RoomPlan iOS LiDAR scan/ }).click();
  await (await chooser).setFiles(samplePath);
  const dialog = page.getByRole('dialog', { name: 'Import RoomPlan', exact: true });
  await dialog.getByRole('radio', { name: target }).check();
  await dialog.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

async function exportJSON(page: Page) {
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
  return JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
}

for (const target of ['Open as a new project', 'Add to this plan']) {
  test(`a scan whose objects carry attributes imports from the Build tab: ${target}`, async ({ page }) => {
    const sample = JSON.parse(await readFile(samplePath, 'utf8'));
    const attributes = sample.objects.filter((object: any) => Object.keys(object.attributes ?? {}).length).map((object: any) => object.attributes);
    expect(attributes.length).toBeGreaterThan(0);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/editor');
    const status = page.getByRole('application');
    await expect(status).toContainText('0 walls');

    await importSample(page, target);
    await expect(status).toContainText(/\b[1-9]\d* walls\b/);
    await expect(page.getByText("Couldn't import plan")).toHaveCount(0);
    // The attributes travel with the scan, so a sibling planner gets them back on export.
    const project = await exportJSON(page);
    const kept = Object.values(project.interchange?.attributes ?? {});
    expect(kept).toHaveLength(attributes.length);
    expect(kept).toEqual(expect.arrayContaining(attributes));
    expect(errors).toEqual([]);
  });
}
