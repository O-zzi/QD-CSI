import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function AboutSection() {
  return (
    <section id="about" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-about-title">About The Quarterdeck</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Our core vision: Excellence in Play and Community. We are building Islamabad's premier destination for indoor sports, recreation, and social gathering.
            </p>
          </div>
          <Link href="/vision">
            <Button
              variant="outline"
              className="rounded-full"
              data-testid="button-see-vision"
            >
              See Our Vision
            </Button>
          </Link>
        </div>

        <div className="qd-dev-grid">
          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Vision & Philosophy
            </div>
            <p className="text-sm text-muted-foreground">
              The Quarterdeck is born from a simple idea: that sports facilities should be world-class, accessible, and designed for social connection. We prioritize bright, modern architecture, superior court surfaces, and a welcoming atmosphere. Our aim is to cultivate a vibrant community around Padel, Squash, and recreational activities.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              We are locally invested and committed to transparency throughout the construction and launch phases, ensuring the highest standards of quality and service.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="qd-tag">World-Class Courts</span>
              <span className="qd-tag">Community Focus</span>
              <span className="qd-tag">Transparency</span>
              <span className="qd-tag">All-Ages Friendly</span>
            </div>
          </div>

          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              The Project Team
            </div>
            <p className="text-sm text-muted-foreground">
              The project is managed by a consortium of local real estate developers, sports enthusiasts, and seasoned facility operators. We have brought together expertise in engineering, architecture, and sports management to deliver an exceptional facility.
            </p>
            <ul className="list-disc list-inside mt-4 text-sm space-y-1 text-muted-foreground">
              <li>Lead Architect: Studio 78</li>
              <li>Structural Engineering: Eng. Solutions Pvt.</li>
              <li>Padel Court Consultant: International Padel Federation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
