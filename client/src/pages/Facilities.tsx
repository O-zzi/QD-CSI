import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Users, Clock, Star, Crosshair, Spade, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GiTennisRacket, GiSquare } from "react-icons/gi";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";

import padelImage from "@assets/stock_images/padel_tennis_court_i_d29f9aaf.jpg";
import squashImage from "@assets/stock_images/professional_squash__c4dca43a.jpg";
import rifleImage from "@assets/stock_images/air_rifle_shooting_r_931e6002.jpg";
import bridgeImage from "@assets/stock_images/bridge_card_game_clu_6f83cf65.jpg";
import hallImage from "@assets/stock_images/multipurpose_event_h_e7c6ac62.jpg";

const facilityIcons: Record<string, any> = {
  "padel-tennis": GiTennisRacket,
  "squash": GiSquare,
  "air-rifle-range": Crosshair,
  "bridge-room": Spade,
  "multipurpose-hall": Building2,
};

const facilityImages: Record<string, string> = {
  "padel-tennis": padelImage,
  "squash": squashImage,
  "air-rifle-range": rifleImage,
  "bridge-room": bridgeImage,
  "multipurpose-hall": hallImage,
};

interface FacilityDisplay {
  id: number | string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  courtCount: number;
  basePrice: string;
  peakPrice?: string;
  operatingHours: string;
  minPlayers: number;
  maxPlayers: number;
  amenities?: string[];
  requiresCertification: boolean;
  isActive: boolean;
}

const defaultFacilities: FacilityDisplay[] = [
  {
    id: 1,
    name: "Padel Tennis",
    slug: "padel-tennis",
    description: "Experience the fastest-growing racquet sport on our 4 international-standard courts with LED lighting and premium surfaces.",
    longDescription: "Padel Tennis combines elements of tennis and squash in an exciting, social game format. Our courts feature tempered glass walls, professional-grade turf, and state-of-the-art LED lighting for evening play.",
    courtCount: 4,
    basePrice: "6000",
    peakPrice: "8000",
    operatingHours: "6:00 AM - 11:00 PM",
    minPlayers: 4,
    maxPlayers: 4,
    amenities: ["LED Lighting", "Climate Control", "Locker Rooms", "Equipment Rental", "Coaching Available"],
    requiresCertification: false,
    isActive: true,
  },
  {
    id: 2,
    name: "Squash Courts",
    slug: "squash",
    description: "Two championship-grade squash courts built to World Squash Federation standards with glass back walls.",
    longDescription: "Our squash courts meet international competition standards with specially designed floors, glass back walls for viewing, and professional lighting systems. Perfect for casual games or serious training.",
    courtCount: 2,
    basePrice: "4000",
    peakPrice: "6000",
    operatingHours: "6:00 AM - 11:00 PM",
    minPlayers: 2,
    maxPlayers: 2,
    amenities: ["Glass Back Wall", "Pro Lighting", "Locker Rooms", "Equipment Rental"],
    requiresCertification: false,
    isActive: true,
  },
  {
    id: 3,
    name: "Air Rifle Range",
    slug: "air-rifle-range",
    description: "Pakistan's premier 10-meter air rifle range with 6 lanes, electronic scoring, and professional supervision.",
    longDescription: "Our state-of-the-art air rifle range features electronic scoring systems, professional-grade targets, and comprehensive safety measures. All shooters must complete our safety certification course before using the range.",
    courtCount: 6,
    basePrice: "6000",
    peakPrice: "8000",
    operatingHours: "9:00 AM - 9:00 PM",
    minPlayers: 1,
    maxPlayers: 6,
    amenities: ["Electronic Scoring", "Safety Equipment", "Professional Supervision", "Rifle Rental"],
    requiresCertification: true,
    isActive: true,
  },
  {
    id: 5,
    name: "Multipurpose Hall",
    slug: "multipurpose-hall",
    description: "Versatile 500-capacity hall for corporate events, fitness classes, and private functions.",
    longDescription: "Our multipurpose hall offers flexible space for a variety of activities from aerobics classes to corporate events and private functions. Features include a professional sound system, adjustable lighting, and full catering support.",
    courtCount: 1,
    basePrice: "6000",
    peakPrice: "150000",
    operatingHours: "8:00 AM - 10:00 PM",
    minPlayers: 10,
    maxPlayers: 500,
    amenities: ["Sound System", "Projector", "Catering Available", "Flexible Layout"],
    requiresCertification: false,
    isActive: true,
  },
];

export default function Facilities() {
  const { data: dbFacilities } = useQuery<any[]>({
    queryKey: ["/api/facilities"],
  });

  const facilityList: FacilityDisplay[] = dbFacilities && dbFacilities.length > 0 
    ? dbFacilities
        .filter(f => !f.isHidden) // Filter out hidden facilities (like Bridge Room)
        .map(f => ({
          ...f,
          courtCount: f.resourceCount || f.courtCount || 1,
          operatingHours: f.operatingHours || "6:00 AM - 11:00 PM",
          maxPlayers: f.maxPlayers || f.minPlayers || 4,
          basePrice: String(f.basePrice || 0),
          isActive: f.status !== 'CLOSED',
        }))
    : defaultFacilities;

  const activeFacilities = facilityList.filter(f => f.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <PageHero 
          title="Our Facilities"
          subtitle="World-class sports and recreation facilities in Islamabad"
          testId="text-facilities-title"
        />

        <div className="qd-container py-8">
          <PageBreadcrumb />
          <div className="max-w-5xl mx-auto mt-4">
          <div className="grid gap-6">
            {activeFacilities.map((facility) => (
              <Link key={facility.id} href={`/facilities/${facility.slug}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-facility-${facility.slug}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                        {facilityImages[facility.slug] ? (
                          <>
                            <img 
                              src={facilityImages[facility.slug]} 
                              alt={facility.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                            <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                              {(() => {
                                const Icon = facilityIcons[facility.slug] || GiTennisRacket;
                                return <Icon className="w-5 h-5 text-white" />;
                              })()}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            {(() => {
                              const Icon = facilityIcons[facility.slug] || GiTennisRacket;
                              return <Icon className="w-12 h-12 text-primary/50" />;
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold text-xl mb-1">{facility.name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4" /> {facility.courtCount} {facility.courtCount === 1 ? 'Unit' : 'Courts/Lanes'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" /> {facility.minPlayers}-{facility.maxPlayers} players
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {facility.operatingHours}
                              </span>
                            </div>
                          </div>
                          {facility.requiresCertification && (
                            <Badge variant="destructive" className="flex-shrink-0">Certification Required</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-4">{facility.description}</p>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">From </span>
                            <span className="font-semibold text-primary">
                              PKR {parseInt(facility.basePrice).toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">/hour</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-primary">
                            View Details <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold text-primary mb-4">Ready to Book?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Members can book facilities through our online booking system. 
              Log in to access all our premium facilities and exclusive member benefits.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/booking">
                <Button data-testid="button-book-now">
                  Book Now
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" data-testid="button-contact-us">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
