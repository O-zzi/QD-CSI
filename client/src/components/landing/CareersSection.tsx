import { Button } from "@/components/ui/button";

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
    title: "Café & Barista Staff",
    description: "Staff to manage the open café, serving refreshments, light meals, and ensuring a clean, welcoming social environment. Food and beverage experience preferred.",
  },
  {
    title: "Facility Management",
    description: "Experienced individuals for oversight of daily operations, maintenance schedules, staff management, and corporate/event booking coordination. Must have 3+ years in facility operations.",
  },
];

export function CareersSection() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="careers" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-careers-title">Careers at The Quarterdeck</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Join our team! We are looking for passionate, high-energy individuals to help us launch and run Islamabad's premier sports complex.
            </p>
          </div>
          <Button
            className="rounded-full"
            onClick={() => scrollToSection("contact")}
            data-testid="button-submit-cv"
          >
            Submit CV
          </Button>
        </div>

        <div className="qd-rules-grid">
          {positions.map((position, index) => (
            <div key={index} className="qd-rule-item" data-testid={`career-position-${index}`}>
              <h4 className="font-bold text-foreground mb-2">{position.title}</h4>
              <p className="text-sm text-muted-foreground">{position.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
