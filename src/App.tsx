import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

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

const queryClient = new QueryClient();

const AppContent = () => {
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    }>
      {!isMobile ? (
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex h-14 items-center px-4">
                  <SidebarTrigger />
                </div>
              </div>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/creators" element={<Creators />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/chat/:matchId" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/@:userId" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/creator/apply" element={<CreatorApplication />} />
                <Route path="/creator/verify-identity" element={<CreatorVerifyIdentity />} />
                <Route path="/creator/setup" element={<CreatorSetup />} />
                <Route path="/creator/:creatorId" element={<CreatorFeed />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/verifications" element={
            <ProtectedRoute requireAdmin>
              <AdminVerifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/content-moderation" element={
            <ProtectedRoute requireAdmin>
              <AdminContentModeration />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute requireAdmin>
              <AdminAuditLogs />
            </ProtectedRoute>
          } />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/subscription-cancelled" element={<SubscriptionCancelled />} />
          <Route path="/creator/dashboard" element={
            <ProtectedRoute requireCreator>
              <CreatorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/creator/subscribers" element={
            <ProtectedRoute requireCreator>
              <SubscriberManagement />
            </ProtectedRoute>
          } />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/koji-connect" element={<KojiConnect />} />
                <Route path="/settings/privacy" element={<PrivacySettings />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/community" element={<Community />} />
                <Route path="/support" element={<Support />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/@:userId" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/creator/apply" element={<CreatorApplication />} />
          <Route path="/creator/verify-identity" element={<CreatorVerifyIdentity />} />
          <Route path="/creator/setup" element={<CreatorSetup />} />
          <Route path="/creator/:creatorId" element={<CreatorFeed />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/verifications" element={
            <ProtectedRoute requireAdmin>
              <AdminVerifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/content-moderation" element={
            <ProtectedRoute requireAdmin>
              <AdminContentModeration />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute requireAdmin>
              <AdminAuditLogs />
            </ProtectedRoute>
          } />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/subscription-cancelled" element={<SubscriptionCancelled />} />
          <Route path="/creator/dashboard" element={
            <ProtectedRoute requireCreator>
              <CreatorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/creator/subscribers" element={
            <ProtectedRoute requireCreator>
              <SubscriberManagement />
            </ProtectedRoute>
          } />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/koji-connect" element={<KojiConnect />} />
          <Route path="/settings/privacy" element={<PrivacySettings />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/community" element={<Community />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </Suspense>
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
