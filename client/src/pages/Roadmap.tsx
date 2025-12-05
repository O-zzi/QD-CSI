import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Clock, Calendar, Building2, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const phases = [
  {
    id: "phase1",
    title: "Phase 1: Foundation",
    status: "completed",
    timeline: "Q1 2025 - Q2 2025",
    description: "Site acquisition, architectural planning, and regulatory approvals",
    milestones: [
      { text: "Land acquisition completed", done: true },
      { text: "Architectural designs finalized", done: true },
      { text: "Environmental impact assessment", done: true },
      { text: "Building permits obtained", done: true },
      { text: "Ground breaking ceremony", done: true },
    ],
    highlights: [
      "5-acre premium location in Islamabad secured",
      "World-class architectural firm engaged",
      "All regulatory approvals obtained",
    ],
  },
  {
    id: "phase2",
    title: "Phase 2: Construction",
    status: "in_progress",
    timeline: "Q3 2025 - Q2 2026",
    description: "Core infrastructure, facility construction, and equipment installation",
    milestones: [
      { text: "Foundation and structural work", done: true },
      { text: "Padel courts construction", done: true },
      { text: "Squash courts installation", done: false },
      { text: "Air Rifle Range setup", done: false },
      { text: "Multipurpose Hall completion", done: false },
      { text: "Bridge Room finishing", done: false },
    ],
    highlights: [
      "4 international-standard Padel courts",
      "2 championship Squash courts",
      "6-lane precision Air Rifle Range",
      "500-capacity Multipurpose Hall",
    ],
  },
  {
    id: "phase3",
    title: "Phase 3: Finishing",
    status: "upcoming",
    timeline: "Q3 2026",
    description: "Interior finishing, equipment testing, and staff training",
    milestones: [
      { text: "Interior design and furnishing", done: false },
      { text: "Equipment installation and testing", done: false },
      { text: "Staff recruitment and training", done: false },
      { text: "Safety certifications", done: false },
      { text: "Member preview events", done: false },
    ],
    highlights: [
      "Premium locker rooms and amenities",
      "State-of-the-art booking system",
      "Professional coaching staff onboarding",
      "Exclusive founding member previews",
    ],
  },
  {
    id: "launch",
    title: "Grand Launch",
    status: "upcoming",
    timeline: "Q4 2026",
    description: "Official opening and full operations begin",
    milestones: [
      { text: "VIP launch event", done: false },
      { text: "Founding member exclusive access", done: false },
      { text: "Public membership opens", done: false },
      { text: "First tournament announcements", done: false },
      { text: "Academy programs launch", done: false },
    ],
    highlights: [
      "Grand opening celebration",
      "Founding members get first access",
      "Launch tournaments and events",
      "Full facility operations",
    ],
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500">Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500">In Progress</Badge>;
    default:
      return <Badge variant="secondary">Upcoming</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-8 h-8 text-green-500" />;
    case "in_progress":
      return <Clock className="w-8 h-8 text-amber-500" />;
    default:
      return <Calendar className="w-8 h-8 text-muted-foreground" />;
  }
};

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[40vh] min-h-[300px] bg-[#2a4060] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-roadmap-title">
            Development Roadmap
          </h1>
          <p className="text-xl max-w-3xl opacity-90">
            Follow our journey from groundbreaking to grand opening
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
            
            <div className="space-y-8">
              {phases.map((phase, index) => (
                <div key={phase.id} id={phase.id} className="relative" data-testid={`card-phase-${phase.id}`}>
                  <div className="md:ml-16">
                    <div className="absolute left-4 top-6 hidden md:block">
                      {getStatusIcon(phase.status)}
                    </div>
                    
                    <Card className={phase.status === "in_progress" ? "border-amber-500/50 border-2" : ""}>
                      <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="md:hidden">{getStatusIcon(phase.status)}</div>
                            <div>
                              <CardTitle className="text-xl">{phase.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{phase.timeline}</p>
                            </div>
                          </div>
                          {getStatusBadge(phase.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-6">{phase.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Milestones
                            </h4>
                            <ul className="space-y-2">
                              {phase.milestones.map((milestone, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  {milestone.done ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                  )}
                                  <span className={milestone.done ? "" : "text-muted-foreground"}>
                                    {milestone.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              {phase.id === "launch" ? (
                                <PartyPopper className="w-4 h-4" />
                              ) : (
                                <Building2 className="w-4 h-4" />
                              )} 
                              Key Highlights
                            </h4>
                            <ul className="space-y-2">
                              {phase.highlights.map((highlight, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-[#2a4060]">•</span>
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-[#2a4060] mb-4">Be Part of Our Journey</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join as a Founding Member and get exclusive access to preview events, 
              special pricing, and priority booking when we launch.
            </p>
            <Link href="/#membership">
              <Button className="bg-[#2a4060] hover:bg-[#1e3048]" data-testid="button-become-founding-member">
                Become a Founding Member
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
