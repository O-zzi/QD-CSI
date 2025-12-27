import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Crosshair, Building2, Coffee, Spade, Loader2, ChevronRight } from "lucide-react";
import { GiTennisRacket, GiSquare } from "react-icons/gi";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { useQuery } from "@tanstack/react-query";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
    'facilities_cta_url',
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
          <Link href={getValue('facilities_cta_url') || CMS_DEFAULTS.facilities_cta_url || '/booking'}>
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
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {facilities.map((facility) => (
                <CarouselItem key={facility.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Link href={`/facilities/${facility.slug}`}>
                    <div 
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                      data-testid={`card-facility-${facility.slug || facility.id}`}
                    >
                      <img 
                        src={facility.image} 
                        alt={facility.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold backdrop-blur-sm ${
                          facility.status === "soon" 
                            ? "bg-blue-500/80 text-white" 
                            : facility.status === "active" 
                              ? "bg-green-500/80 text-white" 
                              : "bg-gray-500/80 text-white"
                        }`}>
                          {facility.statusLabel}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {facility.name}
                        </h3>
                        <p className="text-sm text-white/80 flex items-center gap-1">
                          {facility.category}
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        )}
      </div>
    </section>
  );
}
