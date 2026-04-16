import { type Page } from 'playwright';

export const unlockWallet = async (page: Page): Promise<void> => {
  const iframe = page.frameLocator('#ui-ses-iframe');
  
  // 等待密码输入框出现，最多重试 3 次
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const password = iframe.getByTestId('okd-input');
      await password.click({ timeout: 20000 });
      await password.fill('1234qwer');
      const submit = iframe.getByTestId('okd-button');
      await submit.click();
      await page.waitForTimeout(3000);
      return;
    } catch (e) {
      if (attempt < 3) {
        console.log(`[wallet] Attempt ${attempt} failed, retrying in 5s...`);
        await page.waitForTimeout(5000);
      } else {
        throw e;
      }
    }
  }
};
