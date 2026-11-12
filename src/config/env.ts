import 'dotenv/config';

/** Centralised, typed access to configuration. Keep all env reads here. */
export const env = {
  baseURL: process.env.BASE_URL ?? 'https://tmerchant.noor.uz',
  coreApiURL: process.env.CORE_API_URL ?? 'https://core.test.api.noor.uz',
  employeesApiURL: process.env.EMPLOYEES_API_URL ?? 'https://eats.test.api.noor.uz/api/v1',
  platform: process.env.X_PLATFORM ?? 'web',
  merchant: {
    phone: process.env.MERCHANT_PHONE ?? '',
    password: process.env.MERCHANT_PASSWORD ?? '',
  },
  /** Hardcoded OTP for the virtual +99800XXXXXXX test numbers (test env only). */
  resetOtp: process.env.RESET_OTP ?? process.env.EMPLOYEE_TEST_OTP ?? '',
};

export const hasMerchantCreds = Boolean(env.merchant.phone && env.merchant.password);
export const hasResetOtp = Boolean(env.resetOtp);

/** Backend auth endpoints, asserted in tests to verify the UI hits the right contract. */
export const api = {
  login: '**/api/v1/auth/merchant',
  logout: '**/api/v1/auth/logout',
  otpSend: '**/api/v1/otp/send',
  otpConfirm: '**/api/v1/otp/confirm',
  setPassword: '**/api/v1/auth/merchants/set-password',
};
