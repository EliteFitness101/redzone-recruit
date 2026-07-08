// Paystack webhook — verifies HMAC SHA512 signature and finalises orders.
// Public endpoint (verify_jwt=false), signature-secured. Idempotent.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const MAKE_WEBHOOK = "https://hook.eu1.make.com/p0c26asklninfrxhp2sw6nkdjjb19a89";
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function fireAutomation(payload: unknown) {
  try {
    await fetch(MAKE_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("[make-webhook] failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  const expected = createHmac("sha512", PAYSTACK_SECRET).update(raw).digest("hex");
  if (sig !== expected) return new Response("invalid_signature", { status: 401 });

  const payload = JSON.parse(raw);
  const event = payload.event as string;
  const data = payload.data;

  if (event === "charge.success" && data?.reference) {
    // Idempotency: only finalise pending orders once
    const { data: existing } = await admin
      .from("orders")
      .select("id, status, user_id, tier, amount_kobo, email, referral_code")
      .eq("reference", data.reference)
      .maybeSingle();
    if (existing && existing.status === "success") {
      return new Response("already_processed", { status: 200 });
    }

    const { data: order } = await admin
      .from("orders")
      .update({ status: "success", paystack_response: data })
      .eq("reference", data.reference)
      .select()
      .maybeSingle();

    if (order?.user_id) {
      await admin.from("enrollments").upsert(
        { user_id: order.user_id, tier: order.tier, order_id: order.id, active: true },
        { onConflict: "user_id,tier" as never, ignoreDuplicates: true } as never,
      );
      await admin.from("user_roles").upsert(
        { user_id: order.user_id, role: "student" },
        { onConflict: "user_id,role" as never, ignoreDuplicates: true } as never,
      );
    }

    // Fire Make.com automation (receipt email, CRM sync, etc.)
    await fireAutomation({
      event: "payment_success",
      reference: data.reference,
      email: order?.email ?? data.customer?.email,
      tier: order?.tier,
      amount_kobo: order?.amount_kobo,
      user_id: order?.user_id,
      referral_code: order?.referral_code,
      paid_at: data.paid_at,
      channel: data.channel,
    });
  }
  return new Response("ok", { status: 200 });
});
