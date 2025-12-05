export function UpdatesSection() {
  const announcements = [
    {
      date: "Dec 2024",
      title: "Steel structure complete – moving to roofing phase",
    },
    {
      date: "Nov 2024",
      title: "All utilities trenching completed on schedule",
    },
    {
      date: "Oct 2024",
      title: "First glass panels for Padel courts ordered",
    },
  ];

  return (
    <section id="updates" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="mb-8">
          <h2 className="qd-section-title" data-testid="text-updates-title">Construction Updates</h2>
          <p className="text-muted-foreground max-w-2xl mt-2">
            Transparent updates on progress, timeline, and achievements. We believe in keeping our future members informed.
          </p>
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
              {announcements.map((item, index) => (
                <div key={index} className="qd-news-item">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                    {item.date}
                  </div>
                  <div className="font-semibold text-sm">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Phase I</div>
            <div className="text-lg font-bold text-green-600">Complete</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Phase II</div>
            <div className="text-lg font-bold text-blue-600">80%</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Phase III</div>
            <div className="text-lg font-bold text-muted-foreground">Q1 2025</div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Launch</div>
            <div className="text-lg font-bold text-amber-600">Q4 2026</div>
          </div>
        </div>
      </div>
    </section>
  );
}
