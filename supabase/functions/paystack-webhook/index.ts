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
    // Always repair entitlement idempotently, including webhook retries after a partial failure.
    const wasAlreadySuccessful = existing?.status === "success";
    const { data: updatedOrder, error: orderError } = await admin
      .from("orders")
      .update({ status: "success", paystack_response: data })
      .eq("reference", data.reference)
      .select()
      .maybeSingle();
    if (orderError) {
      console.error("[payment-finalize] order update failed", orderError);
      return new Response("order_update_failed", { status: 500 });
    }
    const order = updatedOrder ?? existing;

    if (order?.user_id) {
      const { error: enrollmentError } = await admin.from("enrollments").upsert(
        { user_id: order.user_id, tier: order.tier, order_id: order.id, active: true },
        { onConflict: "user_id,tier" as never } as never,
      );
      if (enrollmentError) {
        console.error("[payment-finalize] enrollment upsert failed", enrollmentError);
        return new Response("enrollment_failed", { status: 500 });
      }
      // "player" is a valid app_role enum value in this project; "student" is not.
      const { error: roleError } = await admin.from("user_roles").upsert(
        { user_id: order.user_id, role: "player" },
        { onConflict: "user_id,role" as never, ignoreDuplicates: true } as never,
      );
      if (roleError) {
        console.error("[payment-finalize] role upsert failed", roleError);
        return new Response("role_assignment_failed", { status: 500 });
      }
    }

    // Fire customer onboarding automation only once, on the first successful transition.
    if (!wasAlreadySuccessful) {
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
        next_step_url: "https://martial.resofit.fit/academy",
      });
    }
  }
  return new Response("ok", { status: 200 });
});
