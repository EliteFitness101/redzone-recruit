// Paystack webhook — verifies HMAC SHA512 signature and finalises orders.
// Public endpoint (verify_jwt=false), signature-secured.
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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
  }
  return new Response("ok", { status: 200 });
});
