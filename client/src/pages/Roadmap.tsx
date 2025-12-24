import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Calendar, Building2, PartyPopper, Check, Hammer, HardHat, Rocket, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";

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
  'check-circle': CheckCircle2,
  'clock': Clock,
  'hammer': Hammer,
  'hard-hat': HardHat,
  'rocket': Rocket,
  'target': Target,
  'calendar': Calendar,
};

const getStatusBadge = (phase: ConstructionPhase) => {
  if (phase.isComplete) {
    return <Badge className="bg-green-500">Completed</Badge>;
  }
  if (phase.isActive) {
    return <Badge className="bg-amber-500">In Progress - {phase.progress}%</Badge>;
  }
  return <Badge variant="secondary">Upcoming</Badge>;
};

const getStatusIcon = (phase: ConstructionPhase) => {
  if (phase.isComplete) {
    return <CheckCircle2 className="w-8 h-8 text-green-500" />;
  }
  if (phase.isActive) {
    return <Clock className="w-8 h-8 text-amber-500" />;
  }
  return <Calendar className="w-8 h-8 text-muted-foreground" />;
};

export default function Roadmap() {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="bg-primary py-8 md:py-12">
          <div className="qd-container text-center text-primary-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-roadmap-title">
              Development Roadmap
            </h1>
            <p className="text-sm opacity-80 max-w-2xl mx-auto">
              Follow our journey from groundbreaking to grand opening
            </p>
          </div>
        </div>

        <div className="qd-container py-8">
          <PageBreadcrumb />

        {/* Overall Progress Summary */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="p-6 rounded-xl bg-card border shadow-sm">
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Overall Progress</div>
                <div className="text-2xl font-bold text-primary dark:text-white mt-1">
                  {Math.round(overallProgress)}% Complete
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
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
                  <div className="text-lg font-bold text-amber-600">{sortedPhases.filter(p => p.isActive).length}</div>
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

        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative">
                  <div className="md:ml-16">
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-4" />
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <Skeleton key={j} className="h-4 w-full" />
                            ))}
                          </div>
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <Skeleton key={j} className="h-4 w-full" />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedPhases.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Roadmap Coming Soon</h3>
              <p className="text-muted-foreground">
                Our development timeline will be available shortly.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              
              <div className="space-y-8">
                {sortedPhases.map((phase, index) => (
                  <div key={phase.id} id={phase.id} className="relative" data-testid={`card-phase-${phase.id}`}>
                    <div className="md:ml-16">
                      <div className="absolute left-4 top-6 hidden md:block">
                        {getStatusIcon(phase)}
                      </div>
                      
                      <Card className={phase.isActive ? "border-amber-500/50 border-2" : ""}>
                        <CardHeader>
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="md:hidden">{getStatusIcon(phase)}</div>
                              <div>
                                <CardTitle className="text-xl">{phase.label}: {phase.title}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">{phase.timeframe || 'Timeline TBD'}</p>
                              </div>
                            </div>
                            {getStatusBadge(phase)}
                          </div>
                          
                          {/* Progress bar for active phases */}
                          {phase.isActive && (
                            <div className="mt-4">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                  style={{ width: `${phase.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Milestones */}
                            {phase.milestones && phase.milestones.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" /> Milestones
                                </h4>
                                <ul className="space-y-2">
                                  {phase.milestones.map((milestone, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                      {phase.isComplete ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                      )}
                                      <span className={phase.isComplete ? "" : "text-muted-foreground"}>
                                        {milestone}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Highlights */}
                            {phase.highlights && phase.highlights.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  {phase.icon === 'rocket' ? (
                                    <PartyPopper className="w-4 h-4" />
                                  ) : (
                                    <Building2 className="w-4 h-4" />
                                  )} 
                                  Key Highlights
                                </h4>
                                <ul className="space-y-2">
                                  {phase.highlights.map((highlight, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-primary dark:text-sky-400">•</span>
                                      {highlight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-primary dark:text-sky-400 mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Follow our progress and be the first to know about new developments, 
              preview events, and exclusive opportunities.
            </p>
            <Link href="/contact">
              <Button data-testid="button-register-interest">
                Register Your Interest
              </Button>
            </Link>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
