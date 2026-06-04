import {
  MercadoPagoConfig,
  Preference,
  Payment,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";

import { ConfigurationError } from "@/lib/utils/errors";

import type {
  CreatePreferenceInput,
  CreatePreferenceResult,
  PaymentInfo,
  PaymentProvider,
  VerifyWebhookInput,
} from "./types";

// ST-17 (D1, D7) — Mercado Pago implementation of PaymentProvider (Checkout Pro).
//
// All Mercado Pago SDK usage is confined to this file. Credentials are read
// lazily (not at module load) so the app can boot without them in environments
// that don't process payments, and so missing config surfaces as a clean 500
// via ConfigurationError rather than a crash at import time.

const CURRENCY_ID = "MXN";
// Reject webhook notifications whose signed timestamp drifts more than this,
// mitigating replay attacks.
const SIGNATURE_TOLERANCE_SECONDS = 300;

function parseSignatureTs(xSignature: string | null): number | null {
  if (!xSignature) return null;
  for (const part of xSignature.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.substring(0, eq).trim().toLowerCase() === "ts") {
      const v = part.substring(eq + 1).trim();
      if (/^\d+$/.test(v)) return Number(v);
    }
  }
  return null;
}

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new ConfigurationError("MERCADOPAGO_ACCESS_TOKEN is not set");
  }
  return token;
}

function getWebhookSecret(): string {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    throw new ConfigurationError("MERCADOPAGO_WEBHOOK_SECRET is not set");
  }
  return secret;
}

function getConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: getAccessToken() });
}

export class MercadoPagoProvider implements PaymentProvider {
  async createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult> {
    const preference = new Preference(getConfig());

    // Pre-filling payer.email binds checkout to that address — if it's a real
    // MP account and the credentials are test, MP rejects the payment as a
    // test/prod mismatch even when paying with test cards. Skip it in dev so
    // testers can pay as guest with any test card.
    const payer =
      input.payerEmail && process.env.NODE_ENV === "production"
        ? { email: input.payerEmail }
        : undefined;

    const body = {
      items: [
        {
          id: input.externalReference,
          title: input.title,
          quantity: 1,
          unit_price: input.amount,
          currency_id: CURRENCY_ID,
        },
      ],
      external_reference: input.externalReference,
      payer,
      back_urls: {
        success: input.successUrl,
        pending: input.pendingUrl,
        failure: input.failureUrl,
      },
      auto_return: "approved",
      notification_url: input.notificationUrl,
    };

    const response = await preference.create({ body });

    if (!response.id || !response.init_point) {
      throw new Error("Mercado Pago no devolvió init_point para la preferencia");
    }

    return { preferenceId: response.id, initPoint: response.init_point };
  }

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const payment = new Payment(getConfig());
    const response = await payment.get({ id: paymentId });

    return {
      id: String(response.id ?? paymentId),
      status: response.status ?? "unknown",
      amount: Number(response.transaction_amount ?? 0),
      externalReference: response.external_reference ?? null,
    };
  }

  verifyWebhookSignature(input: VerifyWebhookInput): boolean {
    try {
      // NOTE: We intentionally do NOT pass `toleranceSeconds` to the SDK. The
      // installed mercadopago SDK has a unit bug — it compares Date.now() (ms)
      // against the header ts (seconds) without conversion, so any nonzero
      // tolerance always trips TimestampOutOfTolerance. We enforce the window
      // ourselves below, in seconds.
      WebhookSignatureValidator.validate({
        xSignature: input.xSignature,
        xRequestId: input.xRequestId,
        dataId: input.dataId,
        secret: getWebhookSecret(),
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        return false;
      }
      throw err;
    }

    const ts = parseSignatureTs(input.xSignature);
    if (ts === null) return false;
    const driftSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
    return driftSec <= SIGNATURE_TOLERANCE_SECONDS;
  }
}
