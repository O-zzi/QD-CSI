import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";

const positions = [
  {
    title: "Court Attendants & Desk Staff",
    description: "Full-time and part-time positions available. Responsible for member check-in, court maintenance, customer service, and managing court flow. Excellent communication skills required.",
  },
  {
    title: "Padel & Squash Coaches",
    description: "Experienced, certified coaches to run academies, private lessons, and group clinics. Certification is mandatory. Competitive salary and commission structure offered.",
  },
  {
    title: "Cafe & Barista Staff",
    description: "Staff to manage the open cafe, serving refreshments, light meals, and ensuring a clean, welcoming social environment. Food and beverage experience preferred.",
  },
  {
    title: "Facility Management",
    description: "Experienced individuals for oversight of daily operations, maintenance schedules, staff management, and corporate/event booking coordination. Must have 3+ years in facility operations.",
  },
];

export function CareersSection() {
  const { getValue } = useCmsMultiple([
    'careers_title',
    'careers_subtitle',
    'careers_cta',
  ], CMS_DEFAULTS);

  return (
    <section id="careers" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-careers-title">
              {getValue('careers_title') || CMS_DEFAULTS.careers_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('careers_subtitle') || CMS_DEFAULTS.careers_subtitle}
            </p>
          </div>
          <Link href="/careers">
            <Button className="rounded-full" data-testid="button-submit-cv">
              {getValue('careers_cta') || CMS_DEFAULTS.careers_cta} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="qd-rules-grid">
          {positions.map((position, index) => (
            <Link key={index} href="/careers">
              <div className="qd-rule-item hover-elevate cursor-pointer" data-testid={`career-position-${index}`}>
                <h4 className="font-bold text-foreground mb-2">{position.title}</h4>
                <p className="text-sm text-muted-foreground">{position.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
