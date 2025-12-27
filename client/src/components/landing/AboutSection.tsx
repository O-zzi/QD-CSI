import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";

export function AboutSection() {
  const { getValue } = useCmsMultiple([
    'about_title',
    'about_subtitle',
    'about_cta',
    'about_cta_url',
    'about_vision_title',
    'about_vision_content',
    'about_vision_content_2',
    'about_tags',
    'about_team_title',
    'about_team_content',
    'about_team_credits',
  ], CMS_DEFAULTS);

  const tags = (getValue('about_tags') || CMS_DEFAULTS.about_tags).split(',').map(t => t.trim());
  const credits = (getValue('about_team_credits') || CMS_DEFAULTS.about_team_credits).split('|').map(c => c.trim());

  return (
    <section id="about" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-about-title">
              {getValue('about_title') || CMS_DEFAULTS.about_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('about_subtitle') || CMS_DEFAULTS.about_subtitle}
            </p>
          </div>
          <Link href={getValue('about_cta_url') || CMS_DEFAULTS.about_cta_url || '/vision'}>
            <Button
              variant="outline"
              className="rounded-full"
              data-testid="button-see-vision"
            >
              {getValue('about_cta') || CMS_DEFAULTS.about_cta}
            </Button>
          </Link>
        </div>

        <div className="qd-dev-grid">
          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              {getValue('about_vision_title') || CMS_DEFAULTS.about_vision_title}
            </div>
            <p className="text-sm text-muted-foreground">
              {getValue('about_vision_content') || CMS_DEFAULTS.about_vision_content}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              {getValue('about_vision_content_2') || CMS_DEFAULTS.about_vision_content_2}
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {tags.map((tag, index) => (
                <span key={index} className="qd-tag">{tag}</span>
              ))}
            </div>
          </div>

          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              {getValue('about_team_title') || CMS_DEFAULTS.about_team_title}
            </div>
            <p className="text-sm text-muted-foreground">
              {getValue('about_team_content') || CMS_DEFAULTS.about_team_content}
            </p>
            <ul className="list-disc list-inside mt-4 text-sm space-y-1 text-muted-foreground">
              {credits.map((credit, index) => (
                <li key={index}>{credit}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
