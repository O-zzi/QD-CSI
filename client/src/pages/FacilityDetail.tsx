import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Users, MapPin, Check, AlertTriangle, Calendar, Crosshair, Spade, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GiTennisRacket, GiSquare } from "react-icons/gi";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Facility, FacilityAddOn, PricingTier } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";

import padelImage from "@assets/stock_images/padel_tennis_court_i_a0e484ae.jpg";
import squashImage from "@assets/stock_images/indoor_squash_court__3447d74a.jpg";
import rifleImage from "@assets/stock_images/shooting_range_indoo_e2b54b1a.jpg";
import bridgeImage from "@assets/stock_images/elegant_card_game_ro_42b0454d.jpg";
import hallImage from "@assets/stock_images/large_event_hall_int_32ffc7ae.jpg";

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

const defaultFacilities: Record<string, any> = {
  "padel-tennis": {
    id: 1,
    name: "Padel Tennis",
    slug: "padel-tennis",
    description: "Experience the fastest-growing racquet sport on our 4 international-standard courts.",
    longDescription: "Padel Tennis combines elements of tennis and squash in an exciting, social game format. Our courts feature tempered glass walls, professional-grade artificial turf, and state-of-the-art LED lighting for evening play. Whether you're a beginner or seasoned player, our facilities provide the perfect environment for this dynamic sport.",
    courtCount: 4,
    basePrice: "6000",
    peakPrice: "8000",
    operatingHours: "6:00 AM - 11:00 PM",
    minPlayers: 4,
    maxPlayers: 4,
    amenities: ["LED Lighting", "Climate Control", "Locker Rooms", "Equipment Rental", "Coaching Available", "Video Analysis", "Pro Shop"],
    requiresCertification: false,
    isActive: true,
    features: [
      "4 International-standard courts",
      "Tempered glass walls",
      "Professional-grade artificial turf",
      "LED lighting system for night play",
      "Covered and climate-controlled",
    ],
    addOns: [
      { id: "racket", name: "Rent Racket", price: 500 },
      { id: "balls", name: "Sleeve of Balls", price: 1500 },
      { id: "water", name: "Mineral Water", price: 100 },
      { id: "towel", name: "Fresh Towel", price: 300 },
    ],
  },
  "squash": {
    id: 2,
    name: "Squash Courts",
    slug: "squash",
    description: "Two championship-grade squash courts built to World Squash Federation standards.",
    longDescription: "Our squash courts meet international competition standards with specially designed maple floors, glass back walls for viewing, and professional lighting systems. The courts are perfect for casual games, serious training, or competitive matches.",
    courtCount: 2,
    basePrice: "4000",
    peakPrice: "6000",
    operatingHours: "6:00 AM - 11:00 PM",
    minPlayers: 2,
    maxPlayers: 2,
    amenities: ["Glass Back Wall", "Pro Lighting", "Locker Rooms", "Equipment Rental", "Coaching Available"],
    requiresCertification: false,
    isActive: true,
    features: [
      "2 Championship-grade courts",
      "World Squash Federation compliant",
      "Glass back walls for spectating",
      "Professional maple flooring",
      "Climate-controlled environment",
    ],
    addOns: [
      { id: "sq_racket", name: "Squash Racket Rental", price: 500 },
      { id: "sq_balls", name: "Squash Balls (Tube)", price: 1200 },
      { id: "water", name: "Mineral Water", price: 100 },
      { id: "towel", name: "Fresh Towel", price: 300 },
    ],
  },
  "air-rifle-range": {
    id: 3,
    name: "Air Rifle Range",
    slug: "air-rifle-range",
    description: "Pakistan's premier 10-meter air rifle range with professional supervision.",
    longDescription: "Our state-of-the-art 10-meter air rifle range features electronic scoring systems, professional-grade targets, and comprehensive safety measures. All shooters must complete our mandatory safety certification course before using the range. Professional supervision is provided at all times.",
    courtCount: 6,
    basePrice: "6000",
    peakPrice: "8000",
    operatingHours: "9:00 AM - 9:00 PM",
    minPlayers: 1,
    maxPlayers: 6,
    amenities: ["Electronic Scoring", "Safety Equipment", "Professional Supervision", "Rifle Rental", "Certification Course"],
    requiresCertification: true,
    isActive: true,
    features: [
      "6 Shooting lanes",
      "10-meter Olympic distance",
      "Electronic scoring system",
      "Professional-grade air rifles",
      "Full safety equipment provided",
    ],
    addOns: [
      { id: "ear_protection", name: "Ear Protection", price: 300 },
      { id: "safety_glasses", name: "Safety Glasses", price: 400 },
      { id: "water", name: "Mineral Water", price: 100 },
    ],
  },
  "multipurpose-hall": {
    id: 5,
    name: "Multipurpose Hall",
    slug: "multipurpose-hall",
    description: "Versatile 500-capacity hall for events, fitness classes, and private functions.",
    longDescription: "Our multipurpose hall offers flexible space for a variety of activities from aerobics classes to corporate events and private functions. The venue features a professional sound system, adjustable lighting, projector facilities, and full catering support.",
    courtCount: 1,
    basePrice: "6000",
    peakPrice: "150000",
    operatingHours: "8:00 AM - 10:00 PM",
    minPlayers: 10,
    maxPlayers: 500,
    amenities: ["Sound System", "Projector", "Catering Available", "Flexible Layout", "Stage Available"],
    requiresCertification: false,
    isActive: true,
    features: [
      "500-person capacity",
      "Professional sound system",
      "HD Projector and screen",
      "Flexible seating arrangements",
      "Full catering kitchen",
    ],
    addOns: [
      { id: "mats", name: "Floor Mats", price: 500 },
      { id: "speaker", name: "Speaker & Mic Setup", price: 1500 },
      { id: "water", name: "Mineral Water", price: 100 },
    ],
  },
};

export default function FacilityDetail() {
  const { slug } = useParams();
  
  const { data: dbFacility } = useQuery<Facility>({
    queryKey: ["/api/facilities", slug],
    enabled: !!slug,
  });

  // Fetch pricing tiers for dynamic discount display
  const { data: pricingTiers = [] } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing-tiers"],
  });

  // Extract discount percentages from pricing tier benefits
  const tierDiscounts = useMemo(() => {
    const discounts: Record<string, string> = {};
    pricingTiers.forEach(tier => {
      const benefits = tier.benefits || [];
      const discountBenefit = benefits.find((b: string) => 
        b.toLowerCase().includes('discount') && b.toLowerCase().includes('off-peak')
      );
      if (discountBenefit) {
        const match = discountBenefit.match(/(\d+)%/);
        if (match) {
          discounts[tier.tier] = match[1];
        }
      }
    });
    return discounts;
  }, [pricingTiers]);

  const defaultData = defaultFacilities[slug || ""];
  const facility = dbFacility 
    ? {
        ...defaultData,
        ...dbFacility,
        features: dbFacility.features?.length ? dbFacility.features : defaultData?.features,
        amenities: dbFacility.amenities?.length ? dbFacility.amenities : defaultData?.amenities,
        longDescription: dbFacility.aboutContent || defaultData?.longDescription,
        aboutContent: dbFacility.aboutContent || defaultData?.longDescription,
        operatingHours: (dbFacility as any).operatingHours || defaultData?.operatingHours,
        addOns: (dbFacility as any).addOns || defaultData?.addOns,
        courtCount: dbFacility.resourceCount || (dbFacility as any).courtCount || defaultData?.courtCount,
        pricingNotes: dbFacility.pricingNotes,
        certificationInfo: dbFacility.certificationInfo,
        galleryImages: dbFacility.galleryImages,
        keywords: dbFacility.keywords,
        quickInfo: dbFacility.quickInfo as Record<string, string> | null,
      }
    : defaultData;

  if (!facility) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Facility Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The facility you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/facilities">
              <Button>
                View All Facilities
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const FacilityIcon = facilityIcons[slug || ""] || GiTennisRacket;
  const facilityBgImage = facility.imageUrl || facilityImages[slug || ""] || padelImage;

  useSEO({
    title: facility.name,
    description: facility.description || `Book ${facility.name} at The Quarterdeck sports complex in Islamabad.`,
    ogImage: facilityBgImage,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="relative h-[50vh] min-h-[400px] bg-primary overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${facilityBgImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
              <FacilityIcon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-facility-name">
              {facility.name}
            </h1>
            {facility.requiresCertification && (
              <Badge variant="destructive" className="mb-4">Safety Certification Required</Badge>
            )}
            {facility.restricted && (
              <Badge className="bg-amber-500 mb-4">Founding & Forces Members Only</Badge>
            )}
            <p className="text-xl max-w-3xl opacity-90">{facility.description}</p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <Link href="/facilities">
            <Button variant="ghost" className="mb-8" data-testid="button-back-facilities">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Facilities
            </Button>
          </Link>

          <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">About This Facility</h2>
                <p className="text-muted-foreground leading-relaxed">{facility.longDescription}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">Features</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {facility.features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-primary mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {facility.amenities?.map((amenity: string, index: number) => (
                    <Badge key={index} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
              </section>

              {facility.addOns && facility.addOns.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-primary mb-4">Available Add-Ons</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {facility.addOns.map((addOn: any) => (
                      <Card key={addOn.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <span>{addOn.name}</span>
                          <span className="font-semibold text-primary">
                            PKR {addOn.price.toLocaleString()}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {facility.galleryImages && facility.galleryImages.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-primary mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {facility.galleryImages.map((imageUrl: string, index: number) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={imageUrl} 
                          alt={`${facility.name} gallery image ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`img-gallery-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {facility.quickInfo && Object.keys(facility.quickInfo).length > 0 ? (
                    Object.entries(facility.quickInfo).map(([key, value]: [string, string]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{key}</p>
                          <p className="font-medium">{value}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Operating Hours</p>
                          <p className="font-medium">{facility.operatingHours}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Players</p>
                          <p className="font-medium">{facility.minPlayers} - {facility.maxPlayers} players</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Available Units</p>
                          <p className="font-medium">{facility.courtCount} {facility.courtCount === 1 ? 'Unit' : 'Courts/Lanes'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Off-Peak (10AM-5PM)</span>
                      <span className="font-semibold text-primary">
                        PKR {parseInt(facility.basePrice || "0").toLocaleString()}/hr
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Peak Hours</span>
                      <span className="font-semibold text-primary">
                        PKR {parseInt(facility.peakPrice || "0").toLocaleString()}/hr
                      </span>
                    </div>
                    {Object.keys(tierDiscounts).length > 0 ? (
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Member discounts during off-peak hours (10AM-5PM):
                        <br />
                        {tierDiscounts.FOUNDING && `Founding: ${tierDiscounts.FOUNDING}%`}
                        {tierDiscounts.FOUNDING && tierDiscounts.GOLD && ' | '}
                        {tierDiscounts.GOLD && `Gold: ${tierDiscounts.GOLD}%`}
                        {tierDiscounts.GOLD && tierDiscounts.SILVER && ' | '}
                        {tierDiscounts.SILVER && `Silver: ${tierDiscounts.SILVER}%`}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Members enjoy off-peak discounts (10AM-5PM)
                      </p>
                    )}
                    {facility.pricingNotes && (
                      <p className="text-xs text-muted-foreground pt-2 mt-2 border-t">
                        {facility.pricingNotes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {facility.requiresCertification && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Certification Required</h4>
                        <p className="text-sm text-muted-foreground">
                          {facility.certificationInfo || "Safety certification is mandatory before using this facility. Please complete the certification course first."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Link href="/booking">
                <Button className="w-full" size="lg" data-testid="button-book-facility">
                  <Calendar className="w-4 h-4 mr-2" /> Book This Facility
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
