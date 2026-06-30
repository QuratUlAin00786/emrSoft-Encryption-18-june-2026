import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import {
  authMiddleware,
  requireRole,
  tenantMiddleware,
  type TenantRequest,
} from "./middleware/tenant";
import { invoices, jazzcashTransactions } from "../shared/schema";
import {
  buildHostedPaymentRequest,
  getJazzCashConfig,
  isJazzCashSuccessResponse,
  normalizeCallbackPayload,
  verifySecureHash,
} from "./services/jazzcash";

function getFrontendBillingUrl(subdomain: string, params: Record<string, string>): string {
  const base = (process.env.APP_URL || process.env.BASE_URL || "https://app.emrsoft.ai").replace(
    /\/$/,
    "",
  );
  const query = new URLSearchParams(params).toString();
  return `${base}/${subdomain}/billing?${query}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildJazzCashRedirectHtml(
  formAction: string,
  formFields: Record<string, string>,
): string {
  const inputs = Object.entries(formFields)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to JazzCash</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
    .box { text-align: center; padding: 2rem; }
  </style>
</head>
<body>
  <div class="box">
    <p>Redirecting to JazzCash secure payment gateway...</p>
    <p>If you are not redirected automatically, click Continue.</p>
    <form id="jazzcash-payment-form" method="POST" action="${escapeHtml(formAction)}">
      ${inputs}
      <button type="submit">Continue to JazzCash</button>
    </form>
  </div>
  <script>
    window.addEventListener("load", function () {
      var form = document.getElementById("jazzcash-payment-form");
      if (form) { form.submit(); }
    });
  </script>
</body>
</html>`;
}

async function completeJazzCashPayment(
  txnRecord: typeof jazzcashTransactions.$inferSelect,
  callbackFields: Record<string, string>,
  hashVerified: boolean,
): Promise<{ success: boolean; message: string }> {
  if (txnRecord.status === "completed") {
    return { success: true, message: "Payment already processed" };
  }

  const responseCode =
    callbackFields.pp_ResponseCode ||
    callbackFields.responseCode ||
    callbackFields.pp_responsecode ||
    "";
  const responseMessage =
    callbackFields.pp_ResponseMessage ||
    callbackFields.responseMessage ||
    callbackFields.pp_responsemessage ||
    "";
  const retrievalRef =
    callbackFields.pp_RetrievalReferenceNo ||
    callbackFields.pp_RetreivalReferenceNo ||
    callbackFields.pp_RetreivalReferenceNo ||
    "";

  const success = isJazzCashSuccessResponse(responseCode) && hashVerified;

  await db
    .update(jazzcashTransactions)
    .set({
      status: success ? "completed" : "failed",
      responseCode,
      responseMessage,
      retrievalReferenceNo: retrievalRef || null,
      secureHashVerified: hashVerified,
      callbackPayload: callbackFields,
      updatedAt: new Date(),
    })
    .where(eq(jazzcashTransactions.id, txnRecord.id));

  if (!success) {
    return {
      success: false,
      message: responseMessage || "Payment was not successful",
    };
  }

  const invoice = await storage.getInvoice(txnRecord.invoiceId, txnRecord.organizationId);
  if (!invoice) {
    return { success: false, message: "Invoice not found" };
  }

  if (invoice.status !== "paid") {
    await db
      .update(invoices)
      .set({
        status: "paid",
        paymentMethod: "Jazz Cash",
        paidAmount: invoice.totalAmount,
        paidDate: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invoices.id, txnRecord.invoiceId),
          eq(invoices.organizationId, txnRecord.organizationId),
        ),
      );

    const transactionId = retrievalRef || txnRecord.txnRefNo;
    const existingPayments = await storage.getPaymentsByInvoice(
      txnRecord.invoiceId,
      txnRecord.organizationId,
    );
    const alreadyRecorded = existingPayments.some(
      (p) => p.transactionId === transactionId,
    );

    if (!alreadyRecorded) {
      await storage.createPayment({
        organizationId: txnRecord.organizationId,
        invoiceId: txnRecord.invoiceId,
        patientId: invoice.patientId,
        transactionId,
        amount: invoice.totalAmount,
        currency: txnRecord.currency || "PKR",
        paymentMethod: "online",
        paymentProvider: "jazzcash",
        paymentStatus: "completed",
        paymentDate: new Date(),
        metadata: {
          jazzcashTxnRefNo: txnRecord.txnRefNo,
          jazzcashRetrievalReferenceNo: retrievalRef,
          responseCode,
          responseMessage,
          secureHashVerified: hashVerified,
        },
      });
    }
  }

  return { success: true, message: "Payment completed successfully" };
}

export function registerJazzCashRoutes(app: Express): void {
  app.post(
    "/api/payments/jazzcash/create",
    tenantMiddleware,
    authMiddleware,
    requireRole(["admin", "doctor", "nurse", "receptionist", "patient"]),
    async (req: TenantRequest, res: Response) => {
      try {
        const config = getJazzCashConfig();
        if (!config) {
          return res.status(500).json({
            error: "JazzCash is not configured",
            message: "Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT on the server.",
          });
        }

        const { invoiceId } = z
          .object({ invoiceId: z.number().int().positive() })
          .parse(req.body);

        const invoice = await storage.getInvoice(invoiceId, req.tenant!.id);
        if (!invoice) {
          return res.status(404).json({ error: "Invoice not found" });
        }

        if (invoice.status === "paid") {
          return res.status(400).json({ error: "Invoice is already paid" });
        }

        const organization = await storage.getOrganization(req.tenant!.id);
        const subdomain = organization?.subdomain || req.tenant!.subdomain || "demo";
        const totalAmount =
          typeof invoice.totalAmount === "string"
            ? parseFloat(invoice.totalAmount)
            : Number(invoice.totalAmount);

        if (!totalAmount || totalAmount <= 0) {
          return res.status(400).json({ error: "Invoice amount must be greater than zero" });
        }

        const billReference = invoice.invoiceNumber || `INV-${invoice.id}`;
        const description = `Invoice ${billReference} - ${invoice.patientName || invoice.patientId}`;

        const paymentRequest = buildHostedPaymentRequest({
          config,
          amount: totalAmount,
          billReference,
          description,
          mpf1: String(invoice.id),
        });

        const [txnRecord] = await db
          .insert(jazzcashTransactions)
          .values({
            organizationId: req.tenant!.id,
            invoiceId: invoice.id,
            patientId: invoice.patientId,
            organizationSubdomain: subdomain,
            txnRefNo: paymentRequest.txnRefNo,
            billReference: paymentRequest.billReference,
            amount: totalAmount.toFixed(2),
            amountPaisa: paymentRequest.amountPaisa,
            currency: "PKR",
            status: "pending",
            requestPayload: {
              formAction: paymentRequest.formAction,
              formFields: paymentRequest.formFields,
            },
          })
          .returning();

        res.json({
          success: true,
          transactionId: txnRecord.id,
          txnRefNo: paymentRequest.txnRefNo,
          redirectUrl: `/api/payments/jazzcash/redirect/${txnRecord.id}`,
          formAction: paymentRequest.formAction,
          formFields: paymentRequest.formFields,
          invoiceId: invoice.id,
        });
      } catch (error: any) {
        console.error("[JAZZCASH] Create payment error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid request", details: error.errors });
        }
        res.status(500).json({
          error: "Failed to create JazzCash payment",
          message: error.message || String(error),
        });
      }
    },
  );

  const handleCallback = async (req: Request, res: Response) => {
    try {
      const config = getJazzCashConfig();
      if (!config) {
        return res.status(500).send("JazzCash is not configured");
      }

      const callbackFields = normalizeCallbackPayload({
        ...req.query,
        ...(typeof req.body === "object" && req.body ? req.body : {}),
      });

      const txnRefNo =
        callbackFields.pp_TxnRefNo ||
        callbackFields.pp_txnrefno ||
        callbackFields.TxnRefNo ||
        "";

      const receivedHash =
        callbackFields.pp_SecureHash ||
        callbackFields.secureHash ||
        callbackFields.pp_securehash ||
        "";

      if (!txnRefNo) {
        return res.status(400).send("Missing transaction reference");
      }

      const [txnRecord] = await db
        .select()
        .from(jazzcashTransactions)
        .where(eq(jazzcashTransactions.txnRefNo, txnRefNo))
        .limit(1);

      if (!txnRecord) {
        return res.status(404).send("Transaction not found");
      }

      const hashVerified = verifySecureHash(
        callbackFields,
        receivedHash,
        config.integritySalt,
      );

      const result = await completeJazzCashPayment(txnRecord, callbackFields, hashVerified);
      const subdomain = txnRecord.organizationSubdomain || "demo";

      if (result.success) {
        return res.redirect(
          getFrontendBillingUrl(subdomain, {
            tab: "invoices",
            jazzcash_success: "true",
            invoice_id: String(txnRecord.invoiceId),
            txn_ref: txnRefNo,
          }),
        );
      }

      return res.redirect(
        getFrontendBillingUrl(subdomain, {
          tab: "invoices",
          jazzcash_failed: "true",
          invoice_id: String(txnRecord.invoiceId),
          message: result.message.slice(0, 120),
        }),
      );
    } catch (error) {
      console.error("[JAZZCASH] Callback error:", error);
      res.status(500).send("Payment callback processing failed");
    }
  };

  app.get("/api/payments/jazzcash/callback", handleCallback);
  app.post("/api/payments/jazzcash/callback", handleCallback);

  app.get("/api/payments/jazzcash/redirect/:transactionId", async (req: Request, res: Response) => {
    try {
      const transactionId = Number(req.params.transactionId);
      if (!Number.isInteger(transactionId) || transactionId <= 0) {
        return res.status(400).send("Invalid transaction id");
      }

      const [txnRecord] = await db
        .select()
        .from(jazzcashTransactions)
        .where(eq(jazzcashTransactions.id, transactionId))
        .limit(1);

      if (!txnRecord) {
        return res.status(404).send("Payment session not found");
      }

      if (txnRecord.status !== "pending") {
        return res.status(400).send("This payment session is no longer active");
      }

      const stored = (txnRecord.requestPayload || {}) as {
        formAction?: string;
        formFields?: Record<string, string>;
      };

      let formAction = stored.formAction;
      let formFields = stored.formFields;

      if (!formAction || !formFields) {
        const config = getJazzCashConfig();
        if (!config) {
          return res.status(500).send("JazzCash is not configured");
        }
        const invoice = await storage.getInvoice(txnRecord.invoiceId, txnRecord.organizationId);
        if (!invoice) {
          return res.status(404).send("Invoice not found");
        }
        const totalAmount =
          typeof invoice.totalAmount === "string"
            ? parseFloat(invoice.totalAmount)
            : Number(invoice.totalAmount);
        const rebuilt = buildHostedPaymentRequest({
          config,
          amount: totalAmount,
          billReference: txnRecord.billReference,
          description: `Invoice ${txnRecord.billReference}`,
          txnRefNo: txnRecord.txnRefNo,
          mpf1: String(txnRecord.invoiceId),
        });
        formAction = rebuilt.formAction;
        formFields = rebuilt.formFields;
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(buildJazzCashRedirectHtml(formAction, formFields));
    } catch (error) {
      console.error("[JAZZCASH] Redirect error:", error);
      res.status(500).send("Failed to start JazzCash payment redirect");
    }
  });

  app.get(
    "/api/payments/jazzcash/status/:txnRef",
    tenantMiddleware,
    authMiddleware,
    requireRole(["admin", "doctor", "nurse", "receptionist", "patient"]),
    async (req: TenantRequest, res: Response) => {
      try {
        const txnRef = req.params.txnRef;
        const [txnRecord] = await db
          .select()
          .from(jazzcashTransactions)
          .where(
            and(
              eq(jazzcashTransactions.txnRefNo, txnRef),
              eq(jazzcashTransactions.organizationId, req.tenant!.id),
            ),
          )
          .limit(1);

        if (!txnRecord) {
          return res.status(404).json({ error: "Transaction not found" });
        }

        res.json({
          txnRefNo: txnRecord.txnRefNo,
          invoiceId: txnRecord.invoiceId,
          status: txnRecord.status,
          responseCode: txnRecord.responseCode,
          responseMessage: txnRecord.responseMessage,
          retrievalReferenceNo: txnRecord.retrievalReferenceNo,
          secureHashVerified: txnRecord.secureHashVerified,
        });
      } catch (error: any) {
        console.error("[JAZZCASH] Status error:", error);
        res.status(500).json({ error: "Failed to fetch transaction status" });
      }
    },
  );
}
