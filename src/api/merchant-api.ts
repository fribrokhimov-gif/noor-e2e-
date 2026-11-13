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

  /** Safety-net cleanup for the UI tests: remove an employee by phone if it still exists. */
  async deleteEmployeeByPhone(phone: string): Promise<void> {
    const token = await this.adminToken();
    const res = await this.ctx.get(`${env.employeesApiURL}/merchant-employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) return;
    const list: Array<{ employee_id: string; phone: string }> = (await res.json()).list ?? [];
    const match = list.find((e) => e.phone === phone);
    if (match) await this.deleteAccount(match.employee_id);
  }

  /** A fresh virtual +99800XXXXXXX test number (no real SMS). */
  static virtualPhone(): string {
    return `+99800${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  }

  // ---- Addresses (branches) — used to seed the list for the UI delete test ----

  async createAddress(name: string): Promise<{ id: number; name: string }> {
    const token = await this.adminToken();
    const res = await this.ctx.post(`${env.coreApiURL}/api/v1/vendors/locations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        location: { lat: 41.311, long: 69.279 },
        address: { ru: 'QA addr', en: 'QA addr', uz: 'QA addr' },
        name, shop_id: null, external_id: null, floor: 3, apartment: null, entrance: null,
        door_phone: null, comment: 'QA e2e', client_phone: '+998901234567', client_name: null, is_business: true,
      },
    });
    if (!res.ok()) throw new Error(`Create address failed: ${res.status()} ${await res.text()}`);
    return { id: (await res.json()).id, name };
  }

  async deleteAddressById(id: number): Promise<void> {
    const token = await this.adminToken();
    await this.ctx.delete(`${env.coreApiURL}/api/v1/vendors/locations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /** Safety-net cleanup: remove an address by name if it still exists. */
  async deleteAddressByName(name: string): Promise<void> {
    const token = await this.adminToken();
    const res = await this.ctx.get(`${env.coreApiURL}/api/v1/vendors/locations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { is_business: 'true' },
    });
    if (!res.ok()) return;
    const list: Array<{ id: number; name: string }> = (await res.json()) ?? [];
    const match = (Array.isArray(list) ? list : []).find((a) => a.name === name);
    if (match) await this.deleteAddressById(match.id);
  }
}
