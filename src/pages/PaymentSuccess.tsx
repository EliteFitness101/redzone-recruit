import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { CONTACT, waLink } from "@/config/site";

export default function PaymentSuccess() {
  const [sp] = useSearchParams();
  const reference = sp.get("reference") || sp.get("trxref");
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const [tier, setTier] = useState<string>("");

  useEffect(() => {
    if (!reference) return setState("fail");
    supabase.functions.invoke("paystack", { body: { action: "verify", reference } }).then(({ data, error }) => {
      if (error || data?.status !== "success") {
        track("payment_failed", { reference });
        setState("fail");
        return;
      }
      setTier(data.order?.tier ?? "");
      track("payment_success", { reference, tier: data.order?.tier, amount: data.order?.amount_kobo });
      setState("ok");
    });
  }, [reference]);

  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-hero flex items-center justify-center p-6">
      <SEO title={state === "ok" ? "Payment Successful" : "Payment Status"} path="/payment/success" noindex />
      <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-gold mx-auto animate-spin mb-4" />
            <h1 className="font-display text-2xl font-bold">Verifying payment…</h1>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="h-14 w-14 text-gold mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold mb-2">You're in.</h1>
            <p className="text-muted-foreground mb-6">
              Your <span className="text-gold uppercase">{tier}</span> training is activated. Next up: onboarding.
            </p>
            <div className="grid gap-3">
              <Button variant="hero" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="gold" asChild>
                <a
                  href={waLink(`Hi, I just paid for ${tier}. Ref: ${reference}. Please onboard me.`)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", { source: "post_payment" })}
                >
                  Continue on WhatsApp
                </a>
              </Button>
            </div>
          </>
        )}
        {state === "fail" && (
          <>
            <XCircle className="h-14 w-14 text-primary mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Payment not confirmed</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              We couldn't verify this transaction. If you were charged, contact us on WhatsApp with reference: <code className="text-gold">{reference}</code>
            </p>
            <Button variant="gold" asChild>
              <a href={waLink(`Payment issue, reference: ${reference}`)} target="_blank" rel="noopener noreferrer">
                Message support
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
