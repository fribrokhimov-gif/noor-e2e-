import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page.js';
import { ResetPasswordPage } from '../pages/reset-password.page.js';
import { AppShell } from '../pages/app-shell.page.js';
import { StaffPage } from '../pages/staff.page.js';
import { BranchesPage } from '../pages/branches.page.js';
import { MerchantApi, type DisposableAccount } from '../api/merchant-api.js';

type Fixtures = {
  loginPage: LoginPage;
  resetPasswordPage: ResetPasswordPage;
  appShell: AppShell;
  staffPage: StaffPage;
  branchesPage: BranchesPage;
  merchantApi: MerchantApi;
  /** A disposable employee account, provisioned before the test and removed after. */
  disposableAccount: DisposableAccount;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  resetPasswordPage: async ({ page }, use) => {
    await use(new ResetPasswordPage(page));
  },
  appShell: async ({ page }, use) => {
    await use(new AppShell(page));
  },
  staffPage: async ({ page }, use) => {
    await use(new StaffPage(page));
  },
  branchesPage: async ({ page }, use) => {
    await use(new BranchesPage(page));
  },
  merchantApi: async ({}, use) => {
    const api = await MerchantApi.create();
    await use(api);
    await api.dispose();
  },
  disposableAccount: async ({ merchantApi }, use) => {
    const account = await merchantApi.createDisposableAccount();
    await use(account);
    await merchantApi.deleteAccount(account.employeeId);
  },
});

export { expect } from '@playwright/test';
