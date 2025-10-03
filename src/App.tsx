import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";

// Eager load critical pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load other pages for code splitting
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Discover = lazy(() => import("./pages/Discover"));
const Creators = lazy(() => import("./pages/Creators"));
const Matches = lazy(() => import("./pages/Matches"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const CreatorApplication = lazy(() => import("./pages/CreatorApplication"));
const CreatorVerifyIdentity = lazy(() => import("./pages/CreatorVerifyIdentity"));
const CreatorSetup = lazy(() => import("./pages/CreatorSetup"));
const CreatorFeed = lazy(() => import("./pages/CreatorFeed"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const AdminContentModeration = lazy(() => import("./pages/AdminContentModeration"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const SubscriberManagement = lazy(() => import("./pages/SubscriberManagement"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCancelled = lazy(() => import("./pages/SubscriptionCancelled"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Community = lazy(() => import("./pages/Community"));
const Support = lazy(() => import("./pages/Support"));
const Referrals = lazy(() => import("./pages/Referrals"));
const KojiConnect = lazy(() => import("./pages/KojiConnect"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const SecuritySettings = lazy(() => import("./pages/SecuritySettings"));
const AdminRefunds = lazy(() => import("./pages/AdminRefunds"));
const AdminReports = lazy(() => import("./pages/AdminReports"));

const queryClient = new QueryClient();

const AppContent = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isHomePage && (
          <AppSidebar />
        )}
        
        <main className="flex-1">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" text="Loading..." />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} errorElement={<RouteErrorBoundary />} />
              <Route path="/auth" element={<Auth />} errorElement={<RouteErrorBoundary />} />
              <Route path="/reset-password" element={<ResetPassword />} errorElement={<RouteErrorBoundary />} />
              <Route path="/onboarding" element={<Onboarding />} errorElement={<RouteErrorBoundary />} />
              <Route path="/discover" element={<Discover />} errorElement={<RouteErrorBoundary />} />
              <Route path="/creators" element={<Creators />} errorElement={<RouteErrorBoundary />} />
              <Route path="/matches" element={<Matches />} errorElement={<RouteErrorBoundary />} />
              <Route path="/chat/:matchId" element={<Chat />} errorElement={<RouteErrorBoundary />} />
              <Route path="/profile" element={<Profile />} errorElement={<RouteErrorBoundary />} />
              <Route path="/profile/:userId" element={<Profile />} errorElement={<RouteErrorBoundary />} />
              <Route path="/@:userId" element={<Profile />} errorElement={<RouteErrorBoundary />} />
              <Route path="/profile/edit" element={<ProfileEdit />} errorElement={<RouteErrorBoundary />} />
              <Route path="/creator/apply" element={<CreatorApplication />} errorElement={<RouteErrorBoundary />} />
              <Route path="/creator/verify-identity" element={<CreatorVerifyIdentity />} errorElement={<RouteErrorBoundary />} />
              <Route path="/creator/setup" element={<CreatorSetup />} errorElement={<RouteErrorBoundary />} />
              <Route path="/creator/:creatorId" element={<CreatorFeed />} errorElement={<RouteErrorBoundary />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/admin/verifications" element={
                <ProtectedRoute requireAdmin>
                  <AdminVerifications />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/admin/content-moderation" element={
                <ProtectedRoute requireAdmin>
                  <AdminContentModeration />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/admin/audit-logs" element={
                <ProtectedRoute requireAdmin>
                  <AdminAuditLogs />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/admin/refunds" element={
                <ProtectedRoute requireAdmin>
                  <AdminRefunds />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/admin/reports" element={
                <ProtectedRoute requireAdmin>
                  <AdminReports />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/subscriptions" element={<Subscriptions />} errorElement={<RouteErrorBoundary />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} errorElement={<RouteErrorBoundary />} />
              <Route path="/subscription-cancelled" element={<SubscriptionCancelled />} errorElement={<RouteErrorBoundary />} />
              <Route path="/creator/dashboard" element={
                <ProtectedRoute requireCreator>
                  <CreatorDashboard />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/creator/subscribers" element={
                <ProtectedRoute requireCreator>
                  <SubscriberManagement />
                </ProtectedRoute>
              } errorElement={<RouteErrorBoundary />} />
              <Route path="/referrals" element={<Referrals />} errorElement={<RouteErrorBoundary />} />
              <Route path="/koji-connect" element={<KojiConnect />} errorElement={<RouteErrorBoundary />} />
              <Route path="/settings/privacy" element={<PrivacySettings />} errorElement={<RouteErrorBoundary />} />
              <Route path="/settings/security" element={<SecuritySettings />} errorElement={<RouteErrorBoundary />} />
              <Route path="/about" element={<About />} errorElement={<RouteErrorBoundary />} />
              <Route path="/privacy" element={<Privacy />} errorElement={<RouteErrorBoundary />} />
              <Route path="/terms" element={<Terms />} errorElement={<RouteErrorBoundary />} />
              <Route path="/community" element={<Community />} errorElement={<RouteErrorBoundary />} />
              <Route path="/support" element={<Support />} errorElement={<RouteErrorBoundary />} />
              <Route path="*" element={<NotFound />} errorElement={<RouteErrorBoundary />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <OfflineIndicator />
              <Toaster />
              <Sonner />
              <AppContent />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
