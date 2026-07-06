// Paystack initialize + verify (single function, action-based)
// Public endpoint (verify_jwt=false); auth is optional and used only to attribute user_id.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const TIER_AMOUNTS: Record<string, number> = {
  basic: 100_000,
  elite: 1_000_000,
  vip: 3_000_000,
};

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await anon.auth.getClaims(auth.slice(7));
  return (data?.claims?.sub as string) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body.action as "init" | "verify";

    if (action === "init") {
      const { tier, email, referral_code } = body as {
        tier: string; email: string; referral_code?: string;
      };
      const amount = TIER_AMOUNTS[tier];
      if (!amount) return json({ error: "invalid_tier" }, 400);
      if (!email || !/^[^@]+@[^.]+\..+$/.test(email)) return json({ error: "invalid_email" }, 400);

      const user_id = await getUserId(req);
      const origin = req.headers.get("origin") ?? "";
      const reference = `MX-${crypto.randomUUID().split("-")[0]}-${Date.now()}`;

      const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          reference,
          currency: "NGN",
          callback_url: `${origin}/payment/success?reference=${reference}`,
          metadata: { tier, referral_code, user_id },
        }),
      });
      const ps = await psRes.json();
      if (!ps.status) return json({ error: ps.message ?? "paystack_error" }, 502);

      await admin.from("orders").insert({
        user_id,
        email,
        tier,
        amount_kobo: amount,
        reference,
        access_code: ps.data.access_code,
        authorization_url: ps.data.authorization_url,
        referral_code: referral_code ?? null,
        status: "pending",
      });

      return json({
        reference,
        authorization_url: ps.data.authorization_url,
        access_code: ps.data.access_code,
      });
    }

    if (action === "verify") {
      const { reference } = body as { reference: string };
      if (!reference) return json({ error: "missing_reference" }, 400);

      const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const ps = await psRes.json();
      if (!ps.status) return json({ error: ps.message ?? "verify_failed" }, 502);

      const status = ps.data.status === "success" ? "success" : "failed";
      const { data: order } = await admin
        .from("orders")
        .update({ status, paystack_response: ps.data })
        .eq("reference", reference)
        .select()
        .maybeSingle();

      if (status === "success" && order?.user_id) {
        // Idempotent enrollment
        await admin.from("enrollments").upsert(
          { user_id: order.user_id, tier: order.tier, order_id: order.id, active: true },
          { onConflict: "user_id,tier" as never, ignoreDuplicates: true } as never,
        );
        // student role
        await admin.from("user_roles").upsert(
          { user_id: order.user_id, role: "student" },
          { onConflict: "user_id,role" as never, ignoreDuplicates: true } as never,
        );
        // referral commission (10% credit to affiliate)
        if (order.referral_code) {
          const { data: affiliate } = await admin
            .from("profiles").select("id").eq("referral_code", order.referral_code).maybeSingle();
          if (affiliate && affiliate.id !== order.user_id) {
            await admin.from("referrals").insert({
              affiliate_id: affiliate.id,
              referred_user_id: order.user_id,
              order_id: order.id,
              commission_kobo: Math.round(order.amount_kobo * 0.1),
            });
          }
        }
      }
      return json({ status, order });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    console.error("[paystack] error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
