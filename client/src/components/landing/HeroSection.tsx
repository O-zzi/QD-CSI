import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroBackground from "@assets/stock_images/padel_tennis_court_i_37ae0ba3.jpg";

export function HeroSection() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date("2026-10-01T00:00:00");
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="hero" className="qd-section pt-12 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/70 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/70" />
      <div className="qd-container relative z-10">
        <div className="qd-hero-grid">
          <div>
            <div className="qd-eyebrow">
              <span className="qd-eyebrow-dot"></span> Target Launch: Q4 2026
            </div>
            <h1 className="qd-hero-title" data-testid="text-hero-title">
              A bright, premium <span className="qd-hero-highlight">multi-sport arena</span> built for play, performance & community.
            </h1>
            <p className="text-muted-foreground max-w-lg mb-6" data-testid="text-hero-subtitle">
              The Quarterdeck brings state-of-the-art Padel Tennis, Squash, an Air Rifle Range, a Multipurpose Hall, Bridge Room, and an Open Café/Bar experience into a single, purpose-built complex. We are setting the new standard for indoor sports and recreation in Islamabad.
            </p>

            <div className="qd-countdown">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Estimated Launch Countdown
              </div>
              <div className="flex items-center gap-3 font-mono" data-testid="countdown-timer">
                <div className="qd-countdown-unit">
                  <span className="qd-countdown-number">{countdown.days}</span>
                  <span className="qd-countdown-label">Days</span>
                </div>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <div className="qd-countdown-unit">
                  <span className="qd-countdown-number">{countdown.hours}</span>
                  <span className="qd-countdown-label">Hours</span>
                </div>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <div className="qd-countdown-unit">
                  <span className="qd-countdown-number">{countdown.minutes}</span>
                  <span className="qd-countdown-label">Minutes</span>
                </div>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <div className="qd-countdown-unit">
                  <span className="qd-countdown-number">{countdown.seconds}</span>
                  <span className="qd-countdown-label">Seconds</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                onClick={() => scrollToSection("facilities")}
                className="rounded-full px-6"
                data-testid="button-explore-facilities"
              >
                Explore Facilities
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollToSection("updates")}
                className="rounded-full px-6"
                data-testid="button-view-updates"
              >
                View Site Updates
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="qd-status-dot"></span> Construction Active
              </span>
              <span>Transparent progress updates</span>
              <span>Early booking & waitlists planned</span>
            </div>
          </div>

          <aside>
            <div className="qd-hero-card">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm uppercase tracking-widest text-muted-foreground">
                  Construction Status
                </div>
                <span className="text-xs py-1 px-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-slate-800 dark:text-blue-200 font-semibold uppercase tracking-wide">
                  Phase II
                </span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Phase II: Foundation & Structure</span>
                <span>80% Complete</span>
              </div>
              <div className="qd-progress-track">
                <div className="qd-progress-fill" style={{ width: "80%" }}></div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Structural steel erection is complete. Focus shifts to roofing insulation and external cladding to ensure all-weather play capability.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                  <div className="text-xs text-muted-foreground">Steel Erection</div>
                  <div className="font-semibold text-sm">Complete</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                  <div className="text-xs text-muted-foreground">Roofing & MEP</div>
                  <div className="font-semibold text-sm">In Progress</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
