import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { useQuery } from "@tanstack/react-query";
import type { Rule } from "@shared/schema";

export function RulesSection() {
  const { getValue } = useCmsMultiple([
    'rules_title',
    'rules_subtitle',
    'rules_cta',
    'rules_cta_url',
  ], CMS_DEFAULTS);

  const { data: rules, isLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });

  const displayRules = rules?.slice(0, 4) || [];

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
          <Link href={getValue('rules_cta_url') || CMS_DEFAULTS.rules_cta_url || '/rules'}>
            <Button variant="outline" className="rounded-full" data-testid="button-view-all-rules">
              {getValue('rules_cta') || CMS_DEFAULTS.rules_cta} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayRules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Rules coming soon...
          </div>
        ) : (
          <div className="qd-rules-grid">
            {displayRules.map((rule, index) => (
              <Link key={rule.id} href="/rules">
                <div className="qd-rule-item hover-elevate cursor-pointer" data-testid={`rule-item-${index}`}>
                  <h4 className="font-bold text-foreground mb-2">{rule.title}</h4>
                  <p className="text-sm text-muted-foreground">{rule.content}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
