import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";

const rules = [
  {
    title: "Padel/Squash Court Footwear",
    description: "Only non-marking, appropriate indoor court shoes are permitted on playing surfaces. This preserves the court integrity and ensures maximum grip and safety for players.",
  },
  {
    title: "Air Rifle Certification",
    description: "Mandatory 30-minute safety course and proficiency test required before accessing the range. No exceptions for first-time users, regardless of previous experience.",
  },
  {
    title: "Booking & Cancellation Policy",
    description: "24-hour notice is required for all cancellations to avoid a penalty equal to the court fee. Late cancellations will forfeit the fee/credit to ensure fair slot availability for all members.",
  },
  {
    title: "General Conduct & Dress",
    description: "Respect for staff, facilities, and fellow players is mandatory. Appropriate sports attire must be worn. The use of courteous language is expected at all times.",
  },
];

export function RulesSection() {
  const { getValue } = useCmsMultiple([
    'rules_title',
    'rules_subtitle',
    'rules_cta',
  ], CMS_DEFAULTS);

  return (
    <section id="rules" className="qd-section">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-rules-title">
              {getValue('rules_title') || CMS_DEFAULTS.rules_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('rules_subtitle') || CMS_DEFAULTS.rules_subtitle}
            </p>
          </div>
          <Link href="/rules">
            <Button variant="outline" className="rounded-full" data-testid="button-view-all-rules">
              {getValue('rules_cta') || CMS_DEFAULTS.rules_cta} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="qd-rules-grid">
          {rules.map((rule, index) => (
            <Link key={index} href="/rules">
              <div className="qd-rule-item hover-elevate cursor-pointer" data-testid={`rule-item-${index}`}>
                <h4 className="font-bold text-foreground mb-2">{rule.title}</h4>
                <p className="text-sm text-muted-foreground">{rule.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
