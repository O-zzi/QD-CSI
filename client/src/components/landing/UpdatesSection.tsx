import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export function UpdatesSection() {
  const announcements = [
    {
      id: "dec-2024",
      date: "Dec 2024",
      title: "Steel structure complete – moving to roofing phase",
    },
    {
      id: "nov-2024",
      date: "Nov 2024",
      title: "All utilities trenching completed on schedule",
    },
    {
      id: "oct-2024",
      date: "Oct 2024",
      title: "First glass panels for Padel courts ordered",
    },
  ];

  const phases = [
    { id: "phase1", label: "Phase I", status: "Complete", statusColor: "text-green-600", anchor: "phase1" },
    { id: "phase2", label: "Phase II", status: "80%", statusColor: "text-blue-600", anchor: "phase2" },
    { id: "phase3", label: "Phase III", status: "Q1 2025", statusColor: "text-muted-foreground", anchor: "phase3" },
    { id: "launch", label: "Launch", status: "Q4 2026", statusColor: "text-amber-600", anchor: "launch" },
  ];

  return (
    <section id="updates" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-updates-title">Construction Updates</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Transparent updates on progress, timeline, and achievements. We believe in keeping our future members informed.
            </p>
          </div>
          <Link href="/roadmap">
            <span className="text-sm font-semibold text-[#2a4060] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1" data-testid="link-view-roadmap">
              View Full Roadmap <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <div className="qd-dev-grid">
          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Latest Progress Summary
            </div>
            <p className="text-sm text-muted-foreground">
              Construction is on track. Phase II is 80% complete, focusing on the main structural framework and initial MEP (Mechanical, Electrical, Plumbing) installations. The project team is coordinating with international court suppliers to finalize specifications for Padel and Squash surfaces.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="qd-tag">On Schedule</span>
              <span className="qd-tag">Phase II Active</span>
              <span className="qd-tag">MEP Work</span>
              <span className="qd-tag">Court Specs Finalized</span>
            </div>
          </div>

          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Recent Announcements
            </div>
            <div className="qd-news-list">
              {announcements.map((item) => (
                <Link key={item.id} href="/roadmap">
                  <div className="qd-news-item cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 -mx-2 px-2 rounded-md transition-colors" data-testid={`link-announcement-${item.id}`}>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                      {item.date}
                    </div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {item.title}
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-8">
          {phases.map((phase) => (
            <Link key={phase.id} href={`/roadmap#${phase.anchor}`}>
              <div 
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center hover-elevate cursor-pointer transition-shadow hover:shadow-md"
                data-testid={`card-phase-${phase.id}`}
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{phase.label}</div>
                <div className={`text-lg font-bold ${phase.statusColor}`}>{phase.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
