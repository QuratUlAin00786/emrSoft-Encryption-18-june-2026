import crypto from "crypto";

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  sandbox: boolean;
  formActionUrl: string;
  cardApiBaseUrl: string;
}

export function getJazzCashConfig(): JazzCashConfig | null {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID?.trim();
  const password = process.env.JAZZCASH_PASSWORD?.trim();
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT?.trim();
  const returnUrl =
    process.env.JAZZCASH_RETURN_URL?.trim() ||
    `${(process.env.APP_URL || process.env.BASE_URL || "https://app.emrsoft.ai").replace(/\/$/, "")}/api/payments/jazzcash/callback`;

  if (!merchantId || !password || !integritySalt) {
    return null;
  }

  const sandbox = process.env.JAZZCASH_SANDBOX !== "false";
  const host = sandbox
    ? "https://sandbox.jazzcash.com.pk"
    : "https://payments.jazzcash.com.pk";

  return {
    merchantId,
    password,
    integritySalt,
    returnUrl,
    sandbox,
    formActionUrl: `${host}/CustomerPortal/transactionmanagement/merchantform/`,
    cardApiBaseUrl: `${host}/ApplicationAPI/API`,
  };
}

export function formatJazzCashDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

export function generateTxnRefNo(date: Date = new Date()): string {
  return `T${formatJazzCashDateTime(date)}`;
}

export function toJazzCashAmountPaisa(amount: number): string {
  return Math.round(amount * 100).toString();
}

/** HMAC-SHA256 secure hash per JazzCash documentation. */
export function generateSecureHash(
  fields: Record<string, string>,
  integritySalt: string,
): string {
  const sortedKeys = Object.keys(fields)
    .filter(
      (key) =>
        key !== "pp_SecureHash" &&
        key !== "secureHash" &&
        fields[key] !== "" &&
        fields[key] != null,
    )
    .sort();

  let hashString = "";
  for (const key of sortedKeys) {
    hashString += `&${fields[key]}`;
  }
  hashString = `${integritySalt}${hashString}`;

  return crypto
    .createHmac("sha256", integritySalt)
    .update(hashString)
    .digest("hex")
    .toUpperCase();
}

export function verifySecureHash(
  fields: Record<string, string>,
  receivedHash: string,
  integritySalt: string,
): boolean {
  if (!receivedHash) return false;
  const calculated = generateSecureHash(fields, integritySalt);
  return calculated.toUpperCase() === receivedHash.toUpperCase();
}

export interface HostedPaymentRequest {
  formAction: string;
  formFields: Record<string, string>;
  txnRefNo: string;
  billReference: string;
  amountPaisa: string;
}

export function buildHostedPaymentRequest(params: {
  config: JazzCashConfig;
  amount: number;
  billReference: string;
  description: string;
  txnRefNo?: string;
  txnDateTime?: string;
  expiryMinutes?: number;
  mpf1?: string;
}): HostedPaymentRequest {
  const {
    config,
    amount,
    billReference,
    description,
    expiryMinutes = 60 * 24 * 7,
    mpf1 = "",
  } = params;

  const now = new Date();
  const txnDateTime = params.txnDateTime || formatJazzCashDateTime(now);
  const txnRefNo = params.txnRefNo || generateTxnRefNo(now);
  const expiry = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  const amountPaisa = toJazzCashAmountPaisa(amount);

  const formFields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "",
    pp_Language: "EN",
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_ReturnURL: config.returnUrl,
    pp_Amount: amountPaisa,
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: txnDateTime,
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_BillReference: billReference,
    pp_Description: description.slice(0, 200),
    pp_TxnRefNo: txnRefNo,
    pp_BankID: "TBANK",
    pp_ProductID: "RETL",
    ppmpf_1: mpf1,
    ppmpf_2: "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
    pp_SecureHash: "",
  };

  formFields.pp_SecureHash = generateSecureHash(formFields, config.integritySalt);

  return {
    formAction: config.formActionUrl,
    formFields,
    txnRefNo,
    billReference,
    amountPaisa,
  };
}

export function isJazzCashSuccessResponse(responseCode: string | undefined): boolean {
  return responseCode === "000" || responseCode === "00";
}

export function normalizeCallbackPayload(
  source: Record<string, unknown>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;
    normalized[key] = String(value);
  }
  return normalized;
}
