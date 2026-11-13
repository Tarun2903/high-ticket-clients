// Razorpay REST API wrapper – SERVER ONLY (uses the key secret).
// Razorpay is the system of record: orders, payments and the customer details we attach as order
// notes (name / email / phone / UTM) all live in the Razorpay dashboard. We keep no database.

export function paymentConfig() {
  return {
    enabled: process.env.PAYMENTS_ENABLED === "true",
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  };
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  status: string; // created | attempted | paid
  receipt?: string;
  notes?: Record<string, string> | [];
};

export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  email?: string;
  contact?: string;
};

async function api<T>(path: string, init?: { method: "POST" | "PATCH"; body: unknown }): Promise<T> {
  const { keyId, keySecret } = paymentConfig();
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...(init ? { "Content-Type": "application/json" } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay ${init?.method ?? "GET"} ${path.split("?")[0]} responded ${res.status}`);
  return (await res.json()) as T;
}

export const fetchPayment = (paymentId: string) => api<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
export const fetchOrder = (orderId: string) => api<RazorpayOrder>(`/orders/${encodeURIComponent(orderId)}`);

export async function listOrdersByReceipt(receipt: string): Promise<RazorpayOrder[]> {
  const r = await api<{ items?: RazorpayOrder[] }>(`/orders?receipt=${encodeURIComponent(receipt)}&count=20`);
  return r.items ?? [];
}

export const createOrder = (body: { amount: number; currency: string; receipt: string; notes: Record<string, string> }) =>
  api<RazorpayOrder>("/orders", { method: "POST", body });

export const updateOrderNotes = (orderId: string, notes: Record<string, string>) =>
  api<RazorpayOrder>(`/orders/${encodeURIComponent(orderId)}`, { method: "PATCH", body: { notes } });

/** Razorpay returns notes as [] when empty, so normalise to an object. */
export function orderNotes(o: Pick<RazorpayOrder, "notes">): Record<string, string> {
  return Array.isArray(o.notes) || !o.notes ? {} : o.notes;
}
