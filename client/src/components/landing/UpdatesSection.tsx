import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Check, Clock, Wrench, Rocket } from "lucide-react";

interface PhaseData {
  id: string;
  label: string;
  title: string;
  status: string;
  progress: number;
  isComplete: boolean;
  isActive: boolean;
  icon: typeof Check;
  milestones: string[];
  highlights: string[];
  timeframe: string;
}

export function UpdatesSection() {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const phases: PhaseData[] = [
    {
      id: "phase1",
      label: "Phase I",
      title: "Land & Permits",
      status: "Complete",
      progress: 100,
      isComplete: true,
      isActive: false,
      icon: Check,
      timeframe: "Q1-Q2 2024",
      milestones: [
        "Land acquisition finalized",
        "Environmental clearance obtained",
        "Building permits approved",
        "Architectural designs completed",
      ],
      highlights: [
        "2.5 acre prime location secured",
        "All regulatory approvals in place",
        "Master plan approved by CDA",
      ],
    },
    {
      id: "phase2",
      label: "Phase II",
      title: "Foundation & Structure",
      status: "80%",
      progress: 80,
      isComplete: false,
      isActive: true,
      icon: Wrench,
      timeframe: "Q3 2024 - Q1 2025",
      milestones: [
        "Foundation work completed",
        "Steel structure 100% done",
        "Roofing phase in progress",
        "MEP installations ongoing",
      ],
      highlights: [
        "On schedule with timeline",
        "Utilities trenching complete",
        "Padel court glass ordered",
      ],
    },
    {
      id: "phase3",
      label: "Phase III",
      title: "Interiors & Equipment",
      status: "Q1 2025",
      progress: 0,
      isComplete: false,
      isActive: false,
      icon: Clock,
      timeframe: "Q2-Q4 2025",
      milestones: [
        "Interior finishing work",
        "Court surface installation",
        "Range equipment setup",
        "HVAC & electrical completion",
      ],
      highlights: [
        "Premium court surfaces",
        "State-of-the-art equipment",
        "Climate-controlled facilities",
      ],
    },
    {
      id: "launch",
      label: "Launch",
      title: "Grand Opening",
      status: "Q4 2026",
      progress: 0,
      isComplete: false,
      isActive: false,
      icon: Rocket,
      timeframe: "Q4 2026",
      milestones: [
        "Final inspections & certifications",
        "Staff training complete",
        "Soft launch for founding members",
        "Grand public opening",
      ],
      highlights: [
        "Founding member priority access",
        "Launch events & tournaments",
        "Full facility operational",
      ],
    },
  ];

  const overallProgress = phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length;

  return (
    <section id="updates" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-updates-title">Construction Updates</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Transparent updates on progress, timeline, and achievements. Hover over each phase to see milestones.
            </p>
          </div>
          <Link href="/roadmap">
            <span className="text-sm font-semibold text-[#2a4060] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1" data-testid="link-view-roadmap">
              View Full Roadmap <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Interactive Timeline */}
        <div className="relative py-12">
          {/* Progress Line Background */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 dark:bg-slate-700 rounded-full transform -translate-y-1/2" />
          
          {/* Animated Progress Line */}
          <div 
            className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-blue-500 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-out"
            style={{ width: `${overallProgress}%` }}
          />

          {/* Animated Glow Effect */}
          <div 
            className="absolute top-1/2 h-1 w-8 bg-gradient-to-r from-transparent via-white to-transparent rounded-full transform -translate-y-1/2 animate-pulse opacity-80"
            style={{ left: `calc(${overallProgress}% - 16px)` }}
          />

          {/* Phase Points */}
          <div className="relative flex justify-between items-center">
            {phases.map((phase, index) => {
              const PhaseIcon = phase.icon;
              const isHovered = hoveredPhase === phase.id;
              
              return (
                <div 
                  key={phase.id}
                  className="relative flex flex-col items-center"
                  style={{ width: '25%' }}
                  onMouseEnter={() => setHoveredPhase(phase.id)}
                  onMouseLeave={() => setHoveredPhase(null)}
                >
                  {/* Phase Point */}
                  <Link href={`/roadmap#${phase.id}`}>
                    <div 
                      className={`
                        relative z-10 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer
                        transition-all duration-300 ease-out transform
                        ${isHovered ? 'scale-125' : 'scale-100'}
                        ${phase.isComplete 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                          : phase.isActive 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 animate-pulse' 
                            : 'bg-white dark:bg-slate-800 text-muted-foreground border-2 border-gray-300 dark:border-slate-600'
                        }
                      `}
                      data-testid={`timeline-point-${phase.id}`}
                    >
                      <PhaseIcon className="w-6 h-6" />
                      
                      {/* Active Phase Ring Animation */}
                      {phase.isActive && (
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-50" />
                      )}
                    </div>
                  </Link>

                  {/* Phase Label */}
                  <div className="mt-4 text-center">
                    <div className={`text-sm font-bold ${phase.isComplete ? 'text-green-600 dark:text-green-400' : phase.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                      {phase.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{phase.title}</div>
                    <div className={`text-xs font-semibold mt-1 ${phase.isComplete ? 'text-green-600' : phase.isActive ? 'text-blue-600' : 'text-muted-foreground'}`}>
                      {phase.status}
                    </div>
                  </div>

                  {/* Hover Tooltip - Milestones & Highlights */}
                  <div 
                    className={`
                      absolute z-50 w-72 p-4 rounded-xl bg-white dark:bg-slate-800 
                      border border-gray-200 dark:border-slate-700 shadow-2xl
                      transition-all duration-300 ease-out
                      ${isHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}
                      ${index >= 2 ? 'right-0' : 'left-0'}
                    `}
                    style={{ 
                      top: '100%', 
                      marginTop: '80px',
                    }}
                  >
                    {/* Tooltip Arrow */}
                    <div 
                      className={`absolute -top-2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-gray-200 dark:border-slate-700 transform rotate-45 ${index >= 2 ? 'right-8' : 'left-8'}`}
                    />
                    
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase.isComplete ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : phase.isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground'}`}>
                          <PhaseIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">{phase.label}: {phase.title}</div>
                          <div className="text-xs text-muted-foreground">{phase.timeframe}</div>
                        </div>
                      </div>

                      {/* Milestones */}
                      <div className="mb-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-2">
                          Milestones
                        </div>
                        <ul className="space-y-1.5">
                          {phase.milestones.map((milestone, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${phase.isComplete ? 'bg-green-500' : phase.isActive && i < 2 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                              {milestone}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Key Highlights */}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-2">
                          Key Highlights
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.highlights.map((highlight, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Overall Progress
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-[#2a4060] dark:text-blue-400">{Math.round(overallProgress)}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Construction is on track. Phase II is 80% complete, focusing on structural framework and MEP installations.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="qd-tag">On Schedule</span>
              <span className="qd-tag">Phase II Active</span>
              <span className="qd-tag">MEP Work</span>
            </div>
          </div>

          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Recent Milestones
            </div>
            <div className="space-y-3">
              {[
                { date: "Dec 2024", text: "Steel structure complete - moving to roofing phase", status: "done" },
                { date: "Nov 2024", text: "All utilities trenching completed on schedule", status: "done" },
                { date: "Oct 2024", text: "First glass panels for Padel courts ordered", status: "done" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.date}</div>
                    <div className="text-sm font-medium">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
