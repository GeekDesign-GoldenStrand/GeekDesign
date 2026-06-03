import { MercadoPagoProvider } from "./mercadopago";
import type { PaymentProvider } from "./types";

export type {
  PaymentProvider,
  CreatePreferenceInput,
  CreatePreferenceResult,
  PaymentInfo,
  VerifyWebhookInput,
} from "./types";

// Single place that decides which payment provider the app uses. Services call
// getPaymentProvider() and depend only on the PaymentProvider interface, so the
// concrete provider can be swapped here without touching callers (D7).
let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    provider = new MercadoPagoProvider();
  }
  return provider;
}
