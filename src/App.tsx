import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import Creators from "./pages/Creators";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import CreatorApplication from "./pages/CreatorApplication";
import CreatorSetup from "./pages/CreatorSetup";
import CreatorFeed from "./pages/CreatorFeed";
import Subscriptions from "./pages/Subscriptions";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancelled from "./pages/SubscriptionCancelled";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/creator/apply" element={<CreatorApplication />} />
          <Route path="/creator/setup" element={<CreatorSetup />} />
          <Route path="/creator/:creatorId" element={<CreatorFeed />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/subscription-cancelled" element={<SubscriptionCancelled />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
