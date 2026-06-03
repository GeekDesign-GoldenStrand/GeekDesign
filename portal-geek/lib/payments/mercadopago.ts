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

    const response = await preference.create({
      body: {
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
        payer: input.payerEmail ? { email: input.payerEmail } : undefined,
        back_urls: {
          success: input.successUrl,
          pending: input.pendingUrl,
          failure: input.failureUrl,
        },
        auto_return: "approved",
        notification_url: input.notificationUrl,
      },
    });

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
      WebhookSignatureValidator.validate({
        xSignature: input.xSignature,
        xRequestId: input.xRequestId,
        dataId: input.dataId,
        secret: getWebhookSecret(),
        toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
      });
      return true;
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        return false;
      }
      // A missing secret (ConfigurationError) or any unexpected error should
      // propagate — it's a server problem, not an invalid signature.
      throw err;
    }
  }
}
