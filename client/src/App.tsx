import { useState, useCallback, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/SessionProvider";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RouteScrollToTop } from "@/components/RouteScrollToTop";
import { useAdminPath } from "@/hooks/useAdminPath";
import { LogoLoader } from "@/components/LogoLoader";
import { initGA } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Profile from "@/pages/Profile";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
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
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Membership from "@/pages/Membership";
import Certifications from "@/pages/Certifications";
import Updates from "@/pages/Updates";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import AuthCallback from "@/pages/auth/AuthCallback";
import AdminDashboard from "@/pages/admin/Dashboard";
import HomepageManagement from "@/pages/admin/HomepageManagement";
import ComingSoonManagement from "@/pages/admin/ComingSoonManagement";
import FacilitiesManagement from "@/pages/admin/FacilitiesManagement";
import RoadmapManagement from "@/pages/admin/RoadmapManagement";
import EventsManagement from "@/pages/admin/EventsManagement";
import PricingManagement from "@/pages/admin/PricingManagement";
import MembershipTierManagement from "@/pages/admin/MembershipTierManagement";
import AnnouncementsManagement from "@/pages/admin/AnnouncementsManagement";
import CareersManagement from "@/pages/admin/CareersManagement";
import RulesManagement from "@/pages/admin/RulesManagement";
import PolicyManagement from "@/pages/admin/PolicyManagement";
import GalleryManagement from "@/pages/admin/GalleryManagement";
import SiteImagesManagement from "@/pages/admin/SiteImagesManagement";
import BookingsManagement from "@/pages/admin/BookingsManagement";
import BrandingManagement from "@/pages/admin/BrandingManagement";
import FAQManagement from "@/pages/admin/FAQManagement";
import MembersManagement from "@/pages/admin/MembersManagement";
import SiteSettingsManagement from "@/pages/admin/SiteSettingsManagement";
import HeroSectionsManagement from "@/pages/admin/HeroSectionsManagement";
import CTAsManagement from "@/pages/admin/CTAsManagement";
import VenuesManagement from "@/pages/admin/VenuesManagement";
import MembershipApplicationsManagement from "@/pages/admin/MembershipApplicationsManagement";
import CertificationsManagement from "@/pages/admin/CertificationsManagement";
import ComparisonFeaturesManagement from "@/pages/admin/ComparisonFeaturesManagement";
import MemberBenefitsManagement from "@/pages/admin/MemberBenefitsManagement";
import BlogsManagement from "@/pages/admin/BlogsManagement";
import TestimonialsManagement from "@/pages/admin/TestimonialsManagement";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Testimonials from "@/pages/Testimonials";

function AdminRoutes() {
  const { adminPath, isAuthorized, isLoading } = useAdminPath();
  
  if (isLoading) {
    return null;
  }
  
  if (!isAuthorized) {
    return null;
  }
  
  const base = `/${adminPath}`;
  
  return (
    <Switch>
      <Route path={`${base}/homepage`} component={HomepageManagement} />
      <Route path={`${base}/coming-soon`} component={ComingSoonManagement} />
      <Route path={`${base}/venues`} component={VenuesManagement} />
      <Route path={`${base}/facilities`} component={FacilitiesManagement} />
      <Route path={`${base}/roadmap`} component={RoadmapManagement} />
      <Route path={`${base}/events`} component={EventsManagement} />
      <Route path={`${base}/pricing`} component={PricingManagement} />
      <Route path={`${base}/membership-tiers`} component={MembershipTierManagement} />
      <Route path={`${base}/announcements`} component={AnnouncementsManagement} />
      <Route path={`${base}/careers`} component={CareersManagement} />
      <Route path={`${base}/rules`} component={RulesManagement} />
      <Route path={`${base}/policies`} component={PolicyManagement} />
      <Route path={`${base}/gallery`} component={GalleryManagement} />
      <Route path={`${base}/site-images`} component={SiteImagesManagement} />
      <Route path={`${base}/hero-sections`} component={HeroSectionsManagement} />
      <Route path={`${base}/ctas`} component={CTAsManagement} />
      <Route path={`${base}/bookings`} component={BookingsManagement} />
      <Route path={`${base}/branding`} component={BrandingManagement} />
      <Route path={`${base}/faq`} component={FAQManagement} />
      <Route path={`${base}/members`} component={MembersManagement} />
      <Route path={`${base}/membership-applications`} component={MembershipApplicationsManagement} />
      <Route path={`${base}/certifications`} component={CertificationsManagement} />
      <Route path={`${base}/comparison-features`} component={ComparisonFeaturesManagement} />
      <Route path={`${base}/member-benefits`} component={MemberBenefitsManagement} />
      <Route path={`${base}/blogs`} component={BlogsManagement} />
      <Route path={`${base}/testimonials`} component={TestimonialsManagement} />
      <Route path={`${base}/site-settings`} component={SiteSettingsManagement} />
      <Route path={base} component={AdminDashboard} />
    </Switch>
  );
}

function PublicRoutes() {
  const { adminPath, isAuthorized } = useAdminPath();
  const [location] = useLocation();
  
  // Don't render public routes (including 404) when on admin paths
  if (isAuthorized && adminPath && location.startsWith(`/${adminPath}`)) {
    return null;
  }
  
  return (
    <Switch>
      <Route path="/booking" component={Booking} />
      <Route path="/profile" component={Profile} />
      <Route path="/events/:slug" component={EventDetail} />
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
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/membership" component={Membership} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/blog" component={Blog} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/certifications" component={Certifications} />
      <Route path="/updates" component={Updates} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <>
      <AdminRoutes />
      <PublicRoutes />
    </>
  );
}

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Initialize Google Analytics when app loads
  useEffect(() => {
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SupabaseAuthProvider>
          <SessionProvider>
            {!isLoaded && <LogoLoader onLoaded={handleLoaded} minDisplayTime={800} />}
            <Toaster />
            <RouteScrollToTop />
            <Router />
            <WhatsAppButton />
            <ScrollToTop />
          </SessionProvider>
        </SupabaseAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
