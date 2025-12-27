import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { FacilitiesSection } from "@/components/landing/FacilitiesSection";
import { UpdatesSection } from "@/components/landing/UpdatesSection";
import { GallerySection } from "@/components/landing/GallerySection";
import { MembershipSection } from "@/components/landing/MembershipSection";
import { RulesSection } from "@/components/landing/RulesSection";
import { CareersSection } from "@/components/landing/CareersSection";
import { useCmsMultiple, CMS_DEFAULTS, parseCmsBoolean } from "@/hooks/useCms";

export default function Home() {
  const { getValue } = useCmsMultiple([
    'section_about_visible',
    'section_facilities_visible',
    'section_updates_visible',
    'section_gallery_visible',
    'section_membership_visible',
    'section_rules_visible',
    'section_careers_visible',
  ], CMS_DEFAULTS);

  const showAbout = parseCmsBoolean(getValue('section_about_visible'));
  const showFacilities = parseCmsBoolean(getValue('section_facilities_visible'));
  const showUpdates = parseCmsBoolean(getValue('section_updates_visible'));
  const showGallery = parseCmsBoolean(getValue('section_gallery_visible'));
  const showMembership = parseCmsBoolean(getValue('section_membership_visible'));
  const showRules = parseCmsBoolean(getValue('section_rules_visible'));
  const showCareers = parseCmsBoolean(getValue('section_careers_visible'));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        {showAbout && (
          <div className="qd-section-alt">
            <AboutSection />
          </div>
        )}
        {showFacilities && <FacilitiesSection />}
        {showUpdates && (
          <div className="qd-section-alt">
            <UpdatesSection />
          </div>
        )}
        {showGallery && <GallerySection />}
        {showMembership && (
          <div className="qd-section-alt">
            <MembershipSection />
          </div>
        )}
        {showRules && <RulesSection />}
        {showCareers && (
          <div className="qd-section-alt">
            <CareersSection />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
