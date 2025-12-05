import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Target, Dumbbell, Users, Coffee, Crosshair } from "lucide-react";

const facilities = [
  {
    id: "padel",
    name: "Padel Tennis",
    icon: Target,
    category: "Indoor Court",
    status: "soon",
    statusLabel: "Opening Soon",
    description: "World-Class Padel Courts: Three premium glass-backed indoor Padel Courts optimized for competitive doubles play and available year-round, regardless of the weather.",
    footer: "3 courts planned",
  },
  {
    id: "squash",
    name: "Squash Court",
    icon: Dumbbell,
    category: "Indoor Court",
    status: "soon",
    statusLabel: "Opening Soon",
    description: "Dedicated Squash Facility: A single, premium-grade squash court built to international dimensions. Ideal for focused training, intense solo practice, and eventually, club ladder competitions.",
    footer: "Planned | 1 court",
  },
  {
    id: "air_rifle",
    name: "Air Rifle Range",
    icon: Crosshair,
    category: "Precision Sport",
    status: "soon",
    statusLabel: "Opening Soon",
    description: "Certified Precision Range: A safe, controlled, and sound-dampened indoor range compliant with all safety regulations. Access requires mandatory certification.",
    footer: "Certificate-based access",
  },
  {
    id: "hall",
    name: "Multipurpose Hall",
    icon: Users,
    category: "Indoor Space",
    status: "planned",
    statusLabel: "Planned",
    description: "Flexible Event & Training Space: A large, adaptable hall suitable for yoga, aerobics, martial arts, corporate workshops, and private functions. Available for flexible, block, and event-based bookings.",
    footer: "Use-cases evolving",
  },
  {
    id: "bridge",
    name: "Bridge Room",
    icon: Users,
    category: "Mind Sport",
    status: "planned",
    statusLabel: "Planned",
    description: "The Mind Sport Lounge: A quiet, temperature-controlled space designed for comfort and concentration, perfect for Bridge, Chess, and other table-based mind sports and social gatherings.",
    footer: "Table-based bookings",
  },
  {
    id: "cafe",
    name: "Open Café/Bar",
    icon: Coffee,
    category: "Recreation",
    status: "planned",
    statusLabel: "Planned",
    description: "The Quarterdeck Social Hub: A bright, spacious area offering artisanal coffee, healthy refreshments, light meals, and a view overlooking the main courts—perfect for post-match debriefs or casual meetings.",
    footer: "No booking required",
  },
];

export function FacilitiesSection() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="facilities" className="qd-section">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-facilities-title">Facilities at a Glance</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              The complex is engineered for high-performance sports and comfortable recreation. Click "View details" for the dedicated facility pages.
            </p>
          </div>
          <Link href="/booking">
            <Button className="rounded-full" data-testid="button-check-availability">
              Check Court Availability
            </Button>
          </Link>
        </div>

        <div className="qd-facility-grid">
          {facilities.map((facility) => {
            const Icon = facility.icon;
            return (
              <article key={facility.id} className="qd-facility-card" data-testid={`card-facility-${facility.id}`}>
                <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest mb-3">
                  <span>{facility.category}</span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${facility.status === "soon" ? "qd-status-soon" : "qd-status-planned"}`}>
                    {facility.statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-[#2a4060] dark:text-blue-400" />
                  <h3 className="text-xl font-bold">{facility.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-5 min-h-[60px]">
                  {facility.description}
                </p>
                <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t border-gray-100 dark:border-slate-700">
                  <span>{facility.footer}</span>
                  <Link href={`/facility/${facility.id}`}>
                    <span className="font-semibold text-[#2a4060] dark:text-blue-400 cursor-pointer hover:underline">
                      View details
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
