// ST-17 (D7) — Payment provider abstraction (Adapter Pattern, SRS §4.4).
//
// The rest of the app depends only on this interface, never on the Mercado
// Pago SDK directly. Swapping providers (or mocking in tests) means writing a
// new implementation of `PaymentProvider` — no service/route changes.

/** Input to create a Checkout Pro preference (the hosted payment page). */
export interface CreatePreferenceInput {
  /** Maps the future payment back to our order — we use the id_pedido. */
  externalReference: string;
  /** Line shown on the Mercado Pago checkout (e.g. "Pedido GD-2026-00001 — anticipo"). */
  title: string;
  /** Amount to charge in MXN (anticipo or remaining balance). */
  amount: number;
  /** Optional payer email to prefill the checkout. */
  payerEmail?: string;
  /** Redirect targets after the buyer finishes on Mercado Pago (UX only — D2). */
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  /** Server endpoint Mercado Pago calls to confirm the payment (source of truth — D2). */
  notificationUrl: string;
}

export interface CreatePreferenceResult {
  /** Mercado Pago preference id. */
  preferenceId: string;
  /** URL the browser is redirected to so the buyer can pay. */
  initPoint: string;
}

/** Normalized view of a Mercado Pago payment, as needed by our webhook handler. */
export interface PaymentInfo {
  /** Mercado Pago payment id (stored as referencia_mercadopago). */
  id: string;
  /** approved | pending | in_process | rejected | refunded | cancelled | ... */
  status: string;
  /** Amount actually charged. */
  amount: number;
  /** The id_pedido we set as external_reference, or null if absent. */
  externalReference: string | null;
}

/** Raw values the webhook handler extracts from the incoming request. */
export interface VerifyWebhookInput {
  xSignature: string | null;
  xRequestId: string | null;
  /** The `data.id` query param (the payment id Mercado Pago notifies about). */
  dataId: string | null;
}

export interface PaymentProvider {
  /** Create a Checkout Pro preference and return its init_point. */
  createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult>;
  /** Fetch the authoritative payment record by id. */
  getPayment(paymentId: string): Promise<PaymentInfo>;
  /** Verify the authenticity of a webhook notification (HMAC over x-signature). */
  verifyWebhookSignature(input: VerifyWebhookInput): boolean;
}
