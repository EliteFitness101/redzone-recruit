import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export const StickyMobileCTA = () => (
  <div className="fixed bottom-0 inset-x-0 z-30 md:hidden p-3 glass-strong border-t border-border/50 flex gap-2 backdrop-blur-xl">
    <Button
      variant="gold"
      size="sm"
      asChild
      className="flex-1"
      onClick={() => track("cta_click", { source: "sticky_apply" })}
    >
      <Link to="/apply">Apply</Link>
    </Button>
    <Button
      variant="hero"
      size="sm"
      asChild
      className="flex-1"
      onClick={() => track("cta_click", { source: "sticky_train" })}
    >
      <Link to="/pricing">Start Training</Link>
    </Button>
  </div>
);
