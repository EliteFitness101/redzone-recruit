import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { initAnalytics, track } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";
import { Loader2 } from "lucide-react";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const Academy = lazy(() => import("./pages/Academy"));
const CoursePage = lazy(() => import("./pages/CoursePage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Apply = lazy(() => import("./pages/Apply"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Contact = lazy(() => import("./pages/Contact"));
const Profile = lazy(() => import("./pages/Profile"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="animate-spin text-gold" />
  </div>
);

// Capture ?ref= referral code globally, persist to localStorage.
const ReferralCapture = () => {
  const [sp] = useSearchParams();
  useEffect(() => {
    captureAttribution(window.location.search);
    const ref = sp.get("ref");
    if (ref) {
      localStorage.setItem("mx_ref", ref);
      track("cta_click", { source: "referral_landing", ref });
    }
  }, [sp]);
  return null;
};

// Fire pageview on route change for analytics
const RouteTracker = () => {
  const loc = useLocation();
  useEffect(() => {
    window.gtag?.("event", "page_view", { page_path: loc.pathname });
    window.fbq?.("track", "PageView");
    window.ttq?.track("Pageview");
  }, [loc.pathname]);
  return null;
};

const App = () => {
  useEffect(() => { initAnalytics(); }, []);
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <ReferralCapture />
                <RouteTracker />
                <Suspense fallback={<Fallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/academy" element={<Academy />} />
                    <Route path="/academy/:slug" element={<CoursePage />} />
                    <Route path="/academy/:slug/:lessonSlug" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
                    <Route path="/certificate/:code" element={<CertificatePage />} />
                    <Route path="/apply" element={<Apply />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/register" element={<Auth />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <FloatingWhatsApp />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
