import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State { hasError: boolean; msg?: string }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, msg: e.message };
  }
  componentDidCatch(err: Error, info: unknown) {
    console.error("[ErrorBoundary]", err, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="glass-strong rounded-3xl p-10 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Something broke</h1>
          <p className="text-sm text-muted-foreground mb-6">{this.state.msg}</p>
          <Button variant="hero" onClick={() => (window.location.href = "/")}>
            Back to safety
          </Button>
        </div>
      </div>
    );
  }
}
