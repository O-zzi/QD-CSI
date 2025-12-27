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
import { useSEO } from "@/hooks/use-seo";
import { useMemo } from "react";

interface SectionConfig {
  id: string;
  component: () => JSX.Element;
  altBackground: boolean;
  visibilityKey: string;
  orderKey: string;
}

const sectionConfigs: SectionConfig[] = [
  {
    id: 'about',
    component: () => <AboutSection />,
    altBackground: true,
    visibilityKey: 'section_about_visible',
    orderKey: 'section_about_order',
  },
  {
    id: 'facilities',
    component: () => <FacilitiesSection />,
    altBackground: false,
    visibilityKey: 'section_facilities_visible',
    orderKey: 'section_facilities_order',
  },
  {
    id: 'updates',
    component: () => <UpdatesSection />,
    altBackground: true,
    visibilityKey: 'section_updates_visible',
    orderKey: 'section_updates_order',
  },
  {
    id: 'gallery',
    component: () => <GallerySection />,
    altBackground: false,
    visibilityKey: 'section_gallery_visible',
    orderKey: 'section_gallery_order',
  },
  {
    id: 'membership',
    component: () => <MembershipSection />,
    altBackground: true,
    visibilityKey: 'section_membership_visible',
    orderKey: 'section_membership_order',
  },
  {
    id: 'rules',
    component: () => <RulesSection />,
    altBackground: false,
    visibilityKey: 'section_rules_visible',
    orderKey: 'section_rules_order',
  },
  {
    id: 'careers',
    component: () => <CareersSection />,
    altBackground: true,
    visibilityKey: 'section_careers_visible',
    orderKey: 'section_careers_order',
  },
];

export default function Home() {
  useSEO({
    description: "The Quarterdeck is Islamabad's premier sports and recreation complex featuring Padel Tennis, Squash, Air Rifle Range, and exclusive membership packages. Book facilities and join events today.",
  });
  
  const cmsKeys = [
    ...sectionConfigs.map(s => s.visibilityKey),
    ...sectionConfigs.map(s => s.orderKey),
  ];
  
  const { getValue } = useCmsMultiple(cmsKeys, CMS_DEFAULTS);

  const sortedSections = useMemo(() => {
    return sectionConfigs
      .filter(section => parseCmsBoolean(getValue(section.visibilityKey)))
      .sort((a, b) => {
        const orderA = parseInt(getValue(a.orderKey) || '99', 10);
        const orderB = parseInt(getValue(b.orderKey) || '99', 10);
        return orderA - orderB;
      });
  }, [getValue]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        {sortedSections.map((section) => {
          const Component = section.component;
          if (section.altBackground) {
            return (
              <div key={section.id} className="qd-section-alt">
                <Component />
              </div>
            );
          }
          return <Component key={section.id} />;
        })}
      </main>
      <Footer />
    </div>
  );
}
