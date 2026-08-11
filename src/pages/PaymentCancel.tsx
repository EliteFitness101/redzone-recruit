import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-hero flex items-center justify-center p-6">
      <SEO title="Payment Cancelled" path="/payment/cancel" noindex />
      <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
        <XCircle className="h-14 w-14 text-primary mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Payment cancelled</h1>
        <p className="text-muted-foreground mb-6">No charge was made. You can restart when you're ready.</p>
        <Button variant="hero" asChild><Link to="/pricing">Back to pricing</Link></Button>
      </div>
    </div>
  );
}
