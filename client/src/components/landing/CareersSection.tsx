import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { useQuery } from "@tanstack/react-query";
import type { Career } from "@shared/schema";

export function CareersSection() {
  const { getValue } = useCmsMultiple([
    'careers_title',
    'careers_subtitle',
    'careers_cta',
  ], CMS_DEFAULTS);

  const { data: careers, isLoading } = useQuery<Career[]>({
    queryKey: ["/api/careers"],
  });

  const activeCareers = careers?.filter(c => c.isActive)?.slice(0, 4) || [];

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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeCareers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No open positions at the moment. Check back soon!
          </div>
        ) : (
          <div className="qd-rules-grid">
            {activeCareers.map((career, index) => (
              <Link key={career.id} href="/careers">
                <div className="qd-rule-item hover-elevate cursor-pointer" data-testid={`career-position-${index}`}>
                  <h4 className="font-bold text-foreground mb-2">{career.title}</h4>
                  <p className="text-sm text-muted-foreground">{career.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
