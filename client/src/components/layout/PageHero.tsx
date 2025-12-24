import footerBg from "@assets/stock_images/dark_elegant_sports__61a0b4ec.jpg";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  testId?: string;
  subtitleTestId?: string;
}

export function PageHero({ title, subtitle, testId, subtitleTestId }: PageHeroProps) {
  return (
    <div className="relative overflow-hidden py-8 md:py-12">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15] dark:opacity-[0.25]"
        style={{ backgroundImage: `url(${footerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/95 to-primary dark:from-slate-900/90 dark:via-slate-900/95 dark:to-slate-900" />
      <div className="qd-container relative z-10 text-center text-primary-foreground">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid={testId || "text-page-title"}>
          {title}
        </h1>
        {subtitle && (
          <p 
            className="text-sm opacity-80 max-w-2xl mx-auto"
            data-testid={subtitleTestId}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
