import { request, type APIRequestContext } from '@playwright/test';
import { env } from '../config/env.js';

export interface DisposableAccount {
  phone: string;
  employeeId: string;
}

/**
 * Backend helper for test-data setup/teardown (NOT the system under test).
 * Used to provision a disposable merchant employee on a virtual +99800 number so the
 * forgot-password UI flow has a real account to reset, then to clean it up.
 */
export class MerchantApi {
  private constructor(private readonly ctx: APIRequestContext) {}

  static async create(): Promise<MerchantApi> {
    // Honour an outbound proxy when one is configured (e.g. a sandboxed CI runner). In a normal
    // environment HTTPS_PROXY is unset and requests go direct.
    const proxyServer = process.env.HTTPS_PROXY ?? process.env.https_proxy;
    const ctx = await request.newContext({
      extraHTTPHeaders: { 'X-Platform': env.platform, 'Content-Type': 'application/json' },
      ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
    });
    return new MerchantApi(ctx);
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  private async adminToken(): Promise<string> {
    const res = await this.ctx.post(`${env.coreApiURL}/api/v1/auth/merchant`, {
      data: { phone: env.merchant.phone, password: env.merchant.password },
    });
    if (!res.ok()) throw new Error(`Admin login failed: ${res.status()} ${await res.text()}`);
    return (await res.json()).data.access_token;
  }

  /** Provision a disposable employee on a fresh virtual +99800 number. */
  async createDisposableAccount(): Promise<DisposableAccount> {
    const token = await this.adminToken();
    const phone = `+99800${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
    const res = await this.ctx.post(`${env.employeesApiURL}/merchant-employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { new_identity: { phone, role: 'manager', first_name: 'QA', last_name: 'E2E' } },
    });
    if (!res.ok()) throw new Error(`Create employee failed: ${res.status()} ${await res.text()}`);
    const body = await res.json();
    const employee = body?.data?.employee ?? body?.data ?? body;
    return { phone, employeeId: employee.employee_id };
  }

  async deleteAccount(employeeId: string): Promise<void> {
    const token = await this.adminToken();
    await this.ctx.delete(`${env.employeesApiURL}/merchant-employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
