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
import StateLgaHubs from "./pages/StateLgaHubs";

const Academy = lazy(() => import("./pages/Academy"));
const CoursePage = lazy(() => import("./pages/CoursePage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Apply = lazy(() => import("./pages/Apply"));
const FarmRecruit = lazy(() => import("./pages/FarmRecruit"));
const GeneralRecruits = lazy(() => import("./pages/GeneralRecruits"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Contact = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));
const Profile = lazy(() => import("./pages/Profile"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const CYRecruitmentMatrix = lazy(() => import("./pages/admin/CYRecruitmentMatrix"));
const FarmCommandCenter = lazy(() => import("./pages/admin/FarmCommandCenter"));
const FarmModule = lazy(() => import("./pages/admin/FarmModule"));
const FarmSupervisor = lazy(() => import("./pages/admin/FarmSupervisor"));
const FarmReports = lazy(() => import("./pages/admin/FarmReports"));
const FarmCandidates = lazy(() => import("./pages/admin/FarmCandidates"));
const FarmAccessRoute = lazy(() => import("./pages/admin/FarmAccessRoute").then(m => ({ default: m.FarmAccessRoute })));
const MartialVerification = lazy(() => import("./pages/MartialVerification"));\nconst WorkforceModels = lazy(() => import("./pages/admin/WorkforceModels"));

const queryClient = new QueryClient();
const Fallback = () => <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-gold" /></div>;

const ReferralCapture = () => {
  const [sp] = useSearchParams();
  useEffect(() => { captureAttribution(window.location.search); const ref = sp.get("ref"); if (ref) { localStorage.setItem("mx_ref", ref); track("cta_click", { source: "referral_landing", ref }); } }, [sp]);
  return null;
};
const RouteTracker = () => {
  const loc = useLocation();
  useEffect(() => { const page = { page_path: loc.pathname, page_location: window.location.href }; window.gtag?.("event", "page_view", page); window.fbq?.("track", "PageView", page); window.ttq?.track("PageView", page); }, [loc.pathname]);
  return null;
};

const App = () => {
  useEffect(() => { initAnalytics(); }, []);
  return <ErrorBoundary><HelmetProvider><QueryClientProvider client={queryClient}><TooltipProvider><Toaster /><Sonner /><BrowserRouter><AuthProvider><ReferralCapture /><RouteTracker /><Suspense fallback={<Fallback />}><Routes>
    <Route path="/" element={<Index />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/academy" element={<Academy />} />
    <Route path="/academy/:slug" element={<CoursePage />} />
    <Route path="/academy/:slug/:lessonSlug" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
    <Route path="/certificate/:code" element={<CertificatePage />} />
    <Route path="/apply" element={<Apply />} />
    <Route path="/recruit" element={<FarmRecruit />} />
    <Route path="/general-recruits" element={<GeneralRecruits />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/legal" element={<Legal />} />
    <Route path="/legal/:slug" element={<Legal />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/payment/success" element={<PaymentSuccess />} />
    <Route path="/payment/cancel" element={<PaymentCancel />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/register" element={<Auth />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />
    <Route path="/admin/applications" element={<ProtectedRoute requireRole="admin"><AdminApplications /></ProtectedRoute>} />
    <Route path="/admin/reports" element={<ProtectedRoute requireRole="admin"><AdminReports /></ProtectedRoute>} />
    <Route path="/admin/cy-recruitment" element={<ProtectedRoute requireRole="admin"><CYRecruitmentMatrix /></ProtectedRoute>} />\n    <Route path="/admin/workforce-models" element={<ProtectedRoute requireRole="admin"><WorkforceModels /></ProtectedRoute>} />
    <Route path="/admin/farm-command-center" element={<FarmAccessRoute><FarmCommandCenter /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/supervisor" element={<FarmAccessRoute roles={["supervisor"]}><FarmSupervisor /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/reports" element={<FarmAccessRoute roles={["executive","operations"]}><FarmReports /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/workforce" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/gaps" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/productivity" element={<FarmAccessRoute roles={["operations","executive","supervisor","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/recruitment" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/candidates" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmCandidates /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/commercial" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/assurance" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/placements" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/performance" element={<FarmAccessRoute roles={["operations","executive","client"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/admin/farm-command-center/actions" element={<FarmAccessRoute roles={["operations","executive","supervisor"]}><FarmModule /></FarmAccessRoute>} />
    <Route path="/state/lga/hubs" element={<StateLgaHubs />} />
    <Route path="/state/:state/lga/hubs" element={<StateLgaHubs />} />
    <Route path="/state/:state/lga/hubs/:lga" element={<StateLgaHubs />} />
    <Route path="/verification" element={<MartialVerification />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense><FloatingWhatsApp /></AuthProvider></BrowserRouter></TooltipProvider></QueryClientProvider></HelmetProvider></ErrorBoundary>;
};
export default App;
