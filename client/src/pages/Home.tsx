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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <div className="qd-section-alt">
          <AboutSection />
        </div>
        <FacilitiesSection />
        <div className="qd-section-alt">
          <UpdatesSection />
        </div>
        <GallerySection />
        <div className="qd-section-alt">
          <MembershipSection />
        </div>
        <RulesSection />
        <div className="qd-section-alt">
          <CareersSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
