import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Crosshair, Building2, Coffee, Spade, Loader2 } from "lucide-react";
import { GiTennisRacket, GiSquare } from "react-icons/gi";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { useQuery } from "@tanstack/react-query";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

import padelImage from "@assets/stock_images/padel_tennis_court_i_a0e484ae.jpg";
import squashImage from "@assets/stock_images/indoor_squash_court__c97e350b.jpg";
import airRifleImage from "@assets/stock_images/air_rifle_shooting_r_931e6002.jpg";
import hallImage from "@assets/stock_images/large_event_hall_int_39cfb773.jpg";
import bridgeImage from "@assets/stock_images/elegant_card_game_ro_26fec1dc.jpg";
import cafeImage from "@assets/stock_images/modern_cafe_bar_inte_bc2874c0.jpg";

interface FacilityDisplay {
  id: string;
  slug: string;
  name: string;
  icon: IconType | LucideIcon;
  category: string;
  status: string;
  statusLabel: string;
  description: string;
  footer: string;
  image: string;
}

const iconMap: Record<string, IconType | LucideIcon> = {
  "GiTennisRacket": GiTennisRacket,
  "GiSquare": GiSquare,
  "Crosshair": Crosshair,
  "Building2": Building2,
  "Coffee": Coffee,
  "Spade": Spade,
};

const imageMap: Record<string, string> = {
  "padel-tennis": padelImage,
  "squash": squashImage,
  "air-rifle-range": airRifleImage,
  "multipurpose-hall": hallImage,
  "bridge-room": bridgeImage,
  "cafe-bar": cafeImage,
};

const defaultFacilities: FacilityDisplay[] = [
  {
    id: "padel",
    slug: "padel-tennis",
    name: "Padel Tennis",
    icon: GiTennisRacket,
    category: "Indoor Court",
    status: "soon",
    statusLabel: "Opening Soon",
    description: "World-Class Padel Courts: Three premium glass-backed indoor Padel Courts optimized for competitive doubles play and available year-round, regardless of the weather.",
    footer: "3 courts planned",
    image: padelImage,
  },
  {
    id: "squash",
    slug: "squash",
    name: "Squash Court",
    icon: GiSquare,
    category: "Indoor Court",
    status: "soon",
    statusLabel: "Opening Soon",
    description: "Dedicated Squash Facility: A single, premium-grade squash court built to international dimensions. Ideal for focused training, intense solo practice, and eventually, club ladder competitions.",
    footer: "Planned | 1 court",
    image: squashImage,
  },
  {
    id: "air_rifle",
    slug: "air-rifle-range",
    name: "Air Rifle Range",
    icon: Crosshair,
    category: "Precision Sport",
    status: "soon",
    statusLabel: "Opening Soon",
    description: "Certified Precision Range: A safe, controlled, and sound-dampened indoor range compliant with all safety regulations. Access requires mandatory certification.",
    footer: "Certificate-based access",
    image: airRifleImage,
  },
  {
    id: "hall",
    slug: "multipurpose-hall",
    name: "Multipurpose Hall",
    icon: Building2,
    category: "Indoor Space",
    status: "planned",
    statusLabel: "Planned",
    description: "Flexible Event & Training Space: A large, adaptable hall suitable for yoga, aerobics, martial arts, corporate workshops, and private functions. Available for flexible, block, and event-based bookings.",
    footer: "Use-cases evolving",
    image: hallImage,
  },
  {
    id: "cafe",
    slug: "cafe-bar",
    name: "Open Cafe/Bar",
    icon: Coffee,
    category: "Recreation",
    status: "planned",
    statusLabel: "Planned",
    description: "The Quarterdeck Social Hub: A bright, spacious area offering artisanal coffee, healthy refreshments, light meals, and a view overlooking the main courts - perfect for post-match debriefs or casual meetings.",
    footer: "No booking required",
    image: cafeImage,
  },
];

function getStatusLabel(status: string): { status: string; statusLabel: string } {
  switch (status) {
    case 'ACTIVE':
      return { status: 'active', statusLabel: 'Active' };
    case 'OPENING_SOON':
      return { status: 'soon', statusLabel: 'Opening Soon' };
    case 'PLANNED':
    default:
      return { status: 'planned', statusLabel: 'Planned' };
  }
}

export function FacilitiesSection() {
  const { getValue } = useCmsMultiple([
    'facilities_title',
    'facilities_subtitle',
    'facilities_cta',
  ], CMS_DEFAULTS);

  const { data: dbFacilities, isLoading } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  const facilities: FacilityDisplay[] = dbFacilities && dbFacilities.length > 0
    ? dbFacilities.map(f => {
        const statusInfo = getStatusLabel(f.status);
        const defaultFacility = defaultFacilities.find(df => df.slug === f.slug);
        return {
          id: f.id,
          slug: f.slug,
          name: f.name,
          icon: iconMap[f.icon] || defaultFacility?.icon || Building2,
          category: f.category || defaultFacility?.category || 'Facility',
          status: statusInfo.status,
          statusLabel: statusInfo.statusLabel,
          description: f.description || defaultFacility?.description || '',
          footer: `${f.resourceCount || 1} ${f.resourceCount === 1 ? 'court' : 'courts'} available`,
          image: f.imageUrl || imageMap[f.slug] || defaultFacility?.image || hallImage,
        };
      })
    : defaultFacilities;

  return (
    <section id="facilities" className="qd-section">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-facilities-title">
              {getValue('facilities_title') || CMS_DEFAULTS.facilities_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('facilities_subtitle') || CMS_DEFAULTS.facilities_subtitle}
            </p>
          </div>
          <Link href="/booking">
            <Button className="rounded-full" data-testid="button-check-availability">
              {getValue('facilities_cta') || CMS_DEFAULTS.facilities_cta}
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="qd-facility-grid">
            {facilities.map((facility) => {
              const Icon = facility.icon;
              return (
                <article key={facility.id} className="qd-facility-card overflow-hidden" data-testid={`card-facility-${facility.slug || facility.id}`}>
                  <div className="relative h-32 -mx-6 -mt-[1.6rem] mb-4 rounded-t-[20px] overflow-hidden">
                    <img 
                      src={facility.image} 
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent dark:from-slate-800/90 dark:via-slate-800/30" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest mb-3">
                    <span>{facility.category}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold ${facility.status === "soon" ? "qd-status-soon" : facility.status === "active" ? "qd-status-active" : "qd-status-planned"}`}>
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
                    <Link href={`/facilities/${facility.slug}`}>
                      <span className="font-semibold text-[#2a4060] dark:text-blue-400 cursor-pointer hover:underline" data-testid={`link-facility-detail-${facility.slug || facility.id}`}>
                        View details
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
