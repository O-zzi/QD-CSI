import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Check, Clock, Hammer, Rocket, CheckCircle, Target, HardHat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";

interface ConstructionPhase {
  id: string;
  venueId: string | null;
  label: string;
  title: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  progress: number;
  isActive: boolean;
  isComplete: boolean;
  timeframe: string | null;
  milestones: string[];
  highlights: string[];
  icon: string;
  sortOrder: number;
}

const iconMap: Record<string, typeof Check> = {
  'check': Check,
  'check-circle': CheckCircle,
  'clock': Clock,
  'hammer': Hammer,
  'hard-hat': HardHat,
  'rocket': Rocket,
  'target': Target,
};

export function UpdatesSection() {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const { getValue } = useCmsMultiple([
    'updates_title',
    'updates_subtitle',
    'updates_cta',
  ], CMS_DEFAULTS);

  const { data: phases = [], isLoading } = useQuery<ConstructionPhase[]>({
    queryKey: ['/api/construction-phases'],
  });

  const sortedPhases = useMemo(() => {
    return [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [phases]);

  const overallProgress = useMemo(() => {
    if (sortedPhases.length === 0) return 0;
    return sortedPhases.reduce((acc, phase) => acc + phase.progress, 0) / sortedPhases.length;
  }, [sortedPhases]);

  const getStatusLabel = (phase: ConstructionPhase) => {
    if (phase.isComplete) return 'Complete';
    if (phase.isActive) return `${phase.progress}%`;
    return phase.timeframe || 'Upcoming';
  };

  if (isLoading) {
    return (
      <section id="updates" className="qd-section bg-gray-50 dark:bg-slate-900">
        <div className="qd-container">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="relative py-12">
            <Skeleton className="h-1 w-full rounded-full" />
            <div className="flex justify-between mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: '25%' }}>
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="h-4 w-16 mt-4" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (sortedPhases.length === 0) {
    return (
      <section id="updates" className="qd-section bg-gray-50 dark:bg-slate-900">
        <div className="qd-container">
          <div className="text-center py-12">
            <h2 className="qd-section-title mb-4">Construction Updates</h2>
            <p className="text-muted-foreground">Construction timeline coming soon.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="updates" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-updates-title">
              {getValue('updates_title') || CMS_DEFAULTS.updates_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('updates_subtitle') || CMS_DEFAULTS.updates_subtitle}
            </p>
          </div>
          <Link href="/roadmap">
            <span className="text-sm font-semibold text-[#2a4060] dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1" data-testid="link-view-roadmap">
              {getValue('updates_cta') || CMS_DEFAULTS.updates_cta} <ChevronRight className="w-4 h-4" />
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
            {sortedPhases.map((phase, index) => {
              const PhaseIcon = iconMap[phase.icon] || Clock;
              const isHovered = hoveredPhase === phase.id;
              const phaseWidth = sortedPhases.length > 0 ? `${100 / sortedPhases.length}%` : '25%';
              
              return (
                <div 
                  key={phase.id}
                  className="relative flex flex-col items-center"
                  style={{ width: phaseWidth }}
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
                      {getStatusLabel(phase)}
                    </div>
                  </div>

                  {/* Hover Tooltip - Milestones & Highlights */}
                  <div 
                    className={`
                      absolute z-50 w-72 p-4 rounded-xl bg-white dark:bg-slate-800 
                      border border-gray-200 dark:border-slate-700 shadow-2xl
                      transition-all duration-300 ease-out
                      ${isHovered ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}
                      ${index >= sortedPhases.length / 2 ? 'right-0' : 'left-0'}
                    `}
                    style={{ 
                      top: '100%', 
                      marginTop: '80px',
                    }}
                  >
                    {/* Tooltip Arrow */}
                    <div 
                      className={`absolute -top-2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-gray-200 dark:border-slate-700 transform rotate-45 ${index >= sortedPhases.length / 2 ? 'right-8' : 'left-8'}`}
                    />
                    
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase.isComplete ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : phase.isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-slate-700 text-muted-foreground'}`}>
                          <PhaseIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{phase.title}</div>
                          <div className="text-xs text-muted-foreground">{phase.timeframe}</div>
                        </div>
                      </div>

                      {/* Milestones */}
                      {phase.milestones && phase.milestones.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-muted-foreground mb-1.5">MILESTONES</div>
                          <ul className="space-y-1">
                            {phase.milestones.map((milestone, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <Check className={`w-3 h-3 mt-0.5 flex-shrink-0 ${phase.isComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                                <span>{milestone}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Highlights */}
                      {phase.highlights && phase.highlights.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                          <div className="text-xs font-semibold text-muted-foreground mb-1.5">HIGHLIGHTS</div>
                          <ul className="space-y-1">
                            {phase.highlights.map((highlight, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
                                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Summary Card */}
        <div className="mt-8 p-6 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Overall Progress</div>
              <div className="text-2xl font-bold text-[#2a4060] dark:text-white mt-1">
                {Math.round(overallProgress)}% Complete
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{sortedPhases.filter(p => p.isComplete).length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{sortedPhases.filter(p => p.isActive).length}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-muted-foreground">{sortedPhases.filter(p => !p.isComplete && !p.isActive).length}</div>
                <div className="text-xs text-muted-foreground">Upcoming</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
