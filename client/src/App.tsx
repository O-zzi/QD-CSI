import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/SessionProvider";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Profile from "@/pages/Profile";
import Events from "@/pages/Events";
import Leaderboard from "@/pages/Leaderboard";
import Gallery from "@/pages/Gallery";
import Vision from "@/pages/Vision";
import Facilities from "@/pages/Facilities";
import FacilityDetail from "@/pages/FacilityDetail";
import Roadmap from "@/pages/Roadmap";
import Rules from "@/pages/Rules";
import Careers from "@/pages/Careers";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import ComingSoon from "@/pages/ComingSoon";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import AdminDashboard from "@/pages/admin/Dashboard";
import HomepageManagement from "@/pages/admin/HomepageManagement";
import ComingSoonManagement from "@/pages/admin/ComingSoonManagement";
import FacilitiesManagement from "@/pages/admin/FacilitiesManagement";
import RoadmapManagement from "@/pages/admin/RoadmapManagement";
import EventsManagement from "@/pages/admin/EventsManagement";
import PricingManagement from "@/pages/admin/PricingManagement";
import AnnouncementsManagement from "@/pages/admin/AnnouncementsManagement";
import CareersManagement from "@/pages/admin/CareersManagement";
import RulesManagement from "@/pages/admin/RulesManagement";
import PolicyManagement from "@/pages/admin/PolicyManagement";
import GalleryManagement from "@/pages/admin/GalleryManagement";
import SiteImagesManagement from "@/pages/admin/SiteImagesManagement";
import BookingsManagement from "@/pages/admin/BookingsManagement";
import BrandingManagement from "@/pages/admin/BrandingManagement";

function Router() {
  return (
    <Switch>
      <Route path="/booking" component={Booking} />
      <Route path="/profile" component={Profile} />
      <Route path="/events" component={Events} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/vision" component={Vision} />
      <Route path="/facilities/:slug" component={FacilityDetail} />
      <Route path="/facilities" component={Facilities} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/rules" component={Rules} />
      <Route path="/careers" component={Careers} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/admin/homepage" component={HomepageManagement} />
      <Route path="/admin/coming-soon" component={ComingSoonManagement} />
      <Route path="/admin/facilities" component={FacilitiesManagement} />
      <Route path="/admin/roadmap" component={RoadmapManagement} />
      <Route path="/admin/events" component={EventsManagement} />
      <Route path="/admin/pricing" component={PricingManagement} />
      <Route path="/admin/announcements" component={AnnouncementsManagement} />
      <Route path="/admin/careers" component={CareersManagement} />
      <Route path="/admin/rules" component={RulesManagement} />
      <Route path="/admin/policies" component={PolicyManagement} />
      <Route path="/admin/gallery" component={GalleryManagement} />
      <Route path="/admin/site-images" component={SiteImagesManagement} />
      <Route path="/admin/bookings" component={BookingsManagement} />
      <Route path="/admin/branding" component={BrandingManagement} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <Toaster />
          <Router />
          <WhatsAppButton />
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
