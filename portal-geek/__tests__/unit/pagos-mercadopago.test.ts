/**
 * @jest-environment node
 *
 * ST-17 — unit tests for the Mercado Pago payment service: saldo/progress
 * derivation and idempotent webhook processing. Prisma, the payment provider,
 * and the email layer are mocked so this stays a pure logic test.
 */
import { prisma } from "@/lib/db/client";
import { sendPaymentReceiptEmail } from "@/lib/email/payment";
import { getPaymentProvider } from "@/lib/payments";
import { getSaldoByCotizacion, processWebhookPayment } from "@/lib/services/pagos";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";

// ── Mocks ──────────────────────────────────────────────────────────────────────
jest.mock("@/lib/db/client", () => ({
  prisma: {
    cotizaciones: { findUnique: jest.fn() },
    pedidos: { findUnique: jest.fn() },
    pagos: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock("@/lib/payments", () => ({
  getPaymentProvider: jest.fn(),
}));

// Avoid loading the real email layer (resend) and its dependencies.
jest.mock("@/lib/email/payment", () => ({
  sendPaymentReceiptEmail: jest.fn().mockResolvedValue(undefined),
  sendPaymentLinkEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/services/cotizacion-access", () => ({
  createAccessLink: jest.fn().mockResolvedValue("http://localhost:3000/access?token=x"),
}));

const mockCotizacionFindUnique = prisma.cotizaciones.findUnique as jest.Mock;
const mockPedidoFindUnique = prisma.pedidos.findUnique as jest.Mock;
const mockPagoFindUnique = prisma.pagos.findUnique as jest.Mock;
const mockPagoCreate = prisma.pagos.create as jest.Mock;
const mockGetProvider = getPaymentProvider as jest.Mock;
const mockReceiptEmail = sendPaymentReceiptEmail as jest.Mock;

const mockGetPayment = jest.fn();
const mockCreatePreference = jest.fn();

// Detalles that total 1000.00.
const DETALLES = [{ subtotal: "700.00" }, { subtotal: "300.00" }];
const CLIENTE = { nombre_cliente: "Ana", correo_electronico: "ana@example.com" };

function cotizacionWithPedido(pedido: Record<string, unknown> | null) {
  return { folio: "GD-2026-00001", pedido };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetProvider.mockReturnValue({
    getPayment: mockGetPayment,
    createPreference: mockCreatePreference,
    verifyWebhookSignature: jest.fn(),
  });
});

// ── getSaldoByCotizacion ────────────────────────────────────────────────────────
describe("getSaldoByCotizacion", () => {
  it("first payment is the anticipo when nothing is paid yet", async () => {
    mockCotizacionFindUnique.mockResolvedValue(
      cotizacionWithPedido({
        id_pedido: 10,
        monto_anticipo: "300.00",
        detalles: DETALLES,
        pagos: [],
        cliente: CLIENTE,
      })
    );

    const saldo = await getSaldoByCotizacion(1);

    expect(saldo.total).toBe(1000);
    expect(saldo.pagado).toBe(0);
    expect(saldo.saldo).toBe(1000);
    expect(saldo.anticipo).toBe(300);
    expect(saldo.montoDue).toBe(300);
    expect(saldo.concepto).toBe("anticipo");
    expect(saldo.progreso).toBe("Pendiente");
  });

  it("after the anticipo is paid, the next charge is the remaining balance", async () => {
    mockCotizacionFindUnique.mockResolvedValue(
      cotizacionWithPedido({
        id_pedido: 10,
        monto_anticipo: "300.00",
        detalles: DETALLES,
        pagos: [{ estatus_pago: "Pagado", monto_pago: "300.00" }],
        cliente: CLIENTE,
      })
    );

    const saldo = await getSaldoByCotizacion(1);

    expect(saldo.pagado).toBe(300);
    expect(saldo.saldo).toBe(700);
    expect(saldo.montoDue).toBe(700);
    expect(saldo.concepto).toBe("saldo");
    expect(saldo.progreso).toBe("Anticipo cubierto");
  });

  it("reports completo and montoDue 0 once fully paid", async () => {
    mockCotizacionFindUnique.mockResolvedValue(
      cotizacionWithPedido({
        id_pedido: 10,
        monto_anticipo: "300.00",
        detalles: DETALLES,
        pagos: [{ estatus_pago: "Pagado", monto_pago: "1000.00" }],
        cliente: CLIENTE,
      })
    );

    const saldo = await getSaldoByCotizacion(1);

    expect(saldo.saldo).toBe(0);
    expect(saldo.montoDue).toBe(0);
    expect(saldo.concepto).toBe("completo");
    expect(saldo.progreso).toBe("Pago completo");
  });

  it("charges the full total in one go when no anticipo is set", async () => {
    mockCotizacionFindUnique.mockResolvedValue(
      cotizacionWithPedido({
        id_pedido: 10,
        monto_anticipo: null,
        detalles: DETALLES,
        pagos: [],
        cliente: CLIENTE,
      })
    );

    const saldo = await getSaldoByCotizacion(1);

    expect(saldo.anticipo).toBeNull();
    expect(saldo.montoDue).toBe(1000);
    expect(saldo.concepto).toBe("completo");
    expect(saldo.progreso).toBe("Pendiente");
  });

  it("ignores non-Pagado rows when summing what was paid", async () => {
    mockCotizacionFindUnique.mockResolvedValue(
      cotizacionWithPedido({
        id_pedido: 10,
        monto_anticipo: "300.00",
        detalles: DETALLES,
        pagos: [
          { estatus_pago: "Pendiente", monto_pago: "300.00" },
          { estatus_pago: "Reembolsado", monto_pago: "50.00" },
        ],
        cliente: CLIENTE,
      })
    );

    const saldo = await getSaldoByCotizacion(1);

    expect(saldo.pagado).toBe(0);
    expect(saldo.montoDue).toBe(300);
    expect(saldo.progreso).toBe("Pendiente");
  });

  it("throws NotFoundError when the cotización has no pedido yet", async () => {
    mockCotizacionFindUnique.mockResolvedValue(cotizacionWithPedido(null));
    await expect(getSaldoByCotizacion(1)).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ── processWebhookPayment ────────────────────────────────────────────────────────
describe("processWebhookPayment", () => {
  function pedidoFixture(pagos: Array<Record<string, unknown>> = []) {
    return {
      id_pedido: 10,
      monto_anticipo: "300.00",
      detalles: DETALLES,
      pagos,
      cliente: CLIENTE,
      cotizaciones: [{ folio: "GD-2026-00001" }],
    };
  }

  it("ignores payments that are not approved", async () => {
    mockGetPayment.mockResolvedValue({
      id: "pay_1",
      status: "pending",
      amount: 300,
      externalReference: "10",
    });

    await processWebhookPayment("pay_1");

    expect(mockPagoCreate).not.toHaveBeenCalled();
    expect(mockReceiptEmail).not.toHaveBeenCalled();
  });

  it("records an approved payment and emails a receipt", async () => {
    mockGetPayment.mockResolvedValue({
      id: "pay_1",
      status: "approved",
      amount: 300,
      externalReference: "10",
    });
    mockPagoFindUnique.mockResolvedValue(null); // not seen before
    mockPedidoFindUnique.mockResolvedValue(pedidoFixture([]));
    mockPagoCreate.mockResolvedValue({ id_pago: 99 });

    await processWebhookPayment("pay_1");

    expect(mockPagoCreate).toHaveBeenCalledWith({
      data: {
        id_pedido: 10,
        monto_pago: 300,
        metodo_pago: "Mercado Pago",
        referencia_mercadopago: "pay_1",
        estatus_pago: "Pagado",
      },
    });
    expect(mockReceiptEmail).toHaveBeenCalledTimes(1);
    const arg = mockReceiptEmail.mock.calls[0][0];
    expect(arg.progreso).toBe("Anticipo cubierto");
    expect(arg.saldoRestante).toBe(700);
    expect(arg.monto).toBe(300);
  });

  it("is idempotent — a payment id already recorded is not duplicated (D6)", async () => {
    mockGetPayment.mockResolvedValue({
      id: "pay_1",
      status: "approved",
      amount: 300,
      externalReference: "10",
    });
    mockPagoFindUnique.mockResolvedValue({ id_pago: 5 }); // already processed

    await processWebhookPayment("pay_1");

    expect(mockPagoCreate).not.toHaveBeenCalled();
    expect(mockReceiptEmail).not.toHaveBeenCalled();
  });

  it("throws ValidationError when external_reference is missing", async () => {
    mockGetPayment.mockResolvedValue({
      id: "pay_2",
      status: "approved",
      amount: 300,
      externalReference: null,
    });

    await expect(processWebhookPayment("pay_2")).rejects.toBeInstanceOf(ValidationError);
    expect(mockPagoCreate).not.toHaveBeenCalled();
  });

  it("marks Pago completo when the payment settles the full balance", async () => {
    mockGetPayment.mockResolvedValue({
      id: "pay_3",
      status: "approved",
      amount: 700,
      externalReference: "10",
    });
    mockPagoFindUnique.mockResolvedValue(null);
    // anticipo of 300 already paid; this 700 completes the 1000 total.
    mockPedidoFindUnique.mockResolvedValue(
      pedidoFixture([{ estatus_pago: "Pagado", monto_pago: "300.00" }])
    );
    mockPagoCreate.mockResolvedValue({ id_pago: 100 });

    await processWebhookPayment("pay_3");

    const arg = mockReceiptEmail.mock.calls[0][0];
    expect(arg.progreso).toBe("Pago completo");
    expect(arg.saldoRestante).toBe(0);
  });
});
