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
import { ContactSection } from "@/components/landing/ContactSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--qd-bg-main)] dark:bg-slate-950">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <FacilitiesSection />
        <UpdatesSection />
        <GallerySection />
        <MembershipSection />
        <RulesSection />
        <CareersSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
