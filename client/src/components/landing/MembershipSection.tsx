import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Star, Sparkles, Users, ChevronRight } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import type { PricingTier } from "@shared/schema";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import membershipBg from "@assets/stock_images/modern_indoor_sports_8b182ff8.jpg";
import padelImage from "@assets/stock_images/padel_tennis_court_i_a0e484ae.jpg";
import squashImage from "@assets/stock_images/indoor_squash_court__c97e350b.jpg";
import hallImage from "@assets/stock_images/large_event_hall_int_39cfb773.jpg";
import cafeImage from "@assets/stock_images/modern_cafe_bar_inte_bc2874c0.jpg";

const tierIcons: Record<string, any> = {
  FOUNDING: Crown,
  GOLD: Star,
  SILVER: Sparkles,
  GUEST: Users,
};

const tierColors: Record<string, { gradient: string; badge: string }> = {
  FOUNDING: { gradient: 'from-amber-600/90 to-amber-800/90', badge: 'bg-amber-500' },
  GOLD: { gradient: 'from-yellow-500/90 to-yellow-700/90', badge: 'bg-yellow-500' },
  SILVER: { gradient: 'from-gray-500/90 to-gray-700/90', badge: 'bg-gray-500' },
  GUEST: { gradient: 'from-blue-500/90 to-blue-700/90', badge: 'bg-blue-500' },
};

const tierImages: Record<string, string> = {
  FOUNDING: padelImage,
  GOLD: squashImage,
  SILVER: hallImage,
  GUEST: cafeImage,
};

const defaultMembershipTiers = [
  {
    id: "founding",
    name: "Founding",
    tier: "FOUNDING",
    tagline: "Exclusive",
    price: 35000,
    billingPeriod: "monthly",
    closed: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "gold",
    name: "Gold",
    tier: "GOLD",
    tagline: "Premium",
    price: 15000,
    billingPeriod: "monthly",
    closed: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "silver",
    name: "Silver",
    tier: "SILVER",
    tagline: "Standard",
    price: 5000,
    billingPeriod: "monthly",
    closed: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "guest",
    name: "Pay-to-Play",
    tier: "GUEST",
    tagline: "Casual",
    price: 0,
    billingPeriod: "per visit",
    closed: false,
    isActive: true,
    sortOrder: 4,
  },
];

export function MembershipSection() {
  const { getValue } = useCmsMultiple([
    'membership_title',
    'membership_subtitle',
    'membership_cta',
    'membership_cta_url',
  ], CMS_DEFAULTS);

  const { data: apiTiers, isLoading } = useQuery<PricingTier[]>({
    queryKey: ['/api/pricing-tiers'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/pricing-tiers');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const membershipTiers = useMemo(() => {
    if (!apiTiers || apiTiers.length === 0) {
      return defaultMembershipTiers;
    }

    return apiTiers
      .filter(t => t.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(tier => ({
        id: tier.id,
        name: tier.name,
        tier: tier.tier,
        tagline: tier.tier === 'FOUNDING' ? 'Exclusive' : 
                 tier.tier === 'GOLD' ? 'Premium' :
                 tier.tier === 'SILVER' ? 'Standard' : 'Casual',
        price: tier.price,
        billingPeriod: tier.billingPeriod || 'monthly',
        closed: tier.tier === 'FOUNDING',
        isActive: tier.isActive,
        sortOrder: tier.sortOrder || 0,
      }));
  }, [apiTiers]);

  const formatPrice = (price: number, period: string) => {
    if (price === 0 || !price) {
      return "Pay per use";
    }
    const suffix = period === 'yearly' ? '/yr' : '/mo';
    return `PKR ${(price / 1000).toFixed(0)}k${suffix}`;
  };

  if (isLoading) {
    return (
      <section id="membership" className="qd-section bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        <div className="qd-container relative z-10">
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] w-72 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="membership" className="qd-section bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 dark:opacity-10"
        style={{ backgroundImage: `url(${membershipBg})` }}
      />
      <div className="qd-container relative z-10">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-membership-title">
              {getValue('membership_title') || CMS_DEFAULTS.membership_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('membership_subtitle') || CMS_DEFAULTS.membership_subtitle}
            </p>
          </div>
          <Link href={getValue('membership_cta_url') || CMS_DEFAULTS.membership_cta_url || '/membership'}>
            <Button className="rounded-full" data-testid="button-inquire-membership">
              {getValue('membership_cta') || CMS_DEFAULTS.membership_cta}
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {membershipTiers.map((tier) => {
              const Icon = tierIcons[tier.tier] || Users;
              const colors = tierColors[tier.tier] || tierColors.GUEST;
              const image = tierImages[tier.tier] || membershipBg;

              return (
                <CarouselItem key={tier.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                  <Link href="/membership">
                    <div 
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
                      data-testid={`membership-tier-${tier.tier.toLowerCase()}`}
                    >
                      <img 
                        src={image} 
                        alt={tier.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${colors.gradient}`} />
                      
                      {tier.closed && (
                        <div className="absolute top-3 left-3">
                          <span className="text-xs px-2 py-1 rounded-full font-bold bg-red-500 text-white">
                            CLOSED
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.badge}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="text-xs uppercase tracking-wider text-white/70 mb-1">
                          {tier.tagline}
                        </p>
                        <h3 className="text-xl font-bold mb-1">
                          {tier.name}
                        </h3>
                        <p className="text-lg font-semibold text-white/90 mb-2">
                          {formatPrice(tier.price, tier.billingPeriod)}
                        </p>
                        <p className="text-sm text-white/80 flex items-center gap-1">
                          View details
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {getValue('membership_footer') || CMS_DEFAULTS.membership_footer}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={getValue('membership_contact_cta_url') || CMS_DEFAULTS.membership_contact_cta_url || '/contact'}>
              <Button 
                variant="outline" 
                className="rounded-full"
                data-testid="button-contact-membership"
              >
                {getValue('membership_contact_cta') || CMS_DEFAULTS.membership_contact_cta}
              </Button>
            </Link>
            <Link href={getValue('membership_terms_cta_url') || CMS_DEFAULTS.membership_terms_cta_url || '/terms'}>
              <Button variant="ghost" className="rounded-full text-muted-foreground" data-testid="button-view-terms-membership">
                {getValue('membership_terms_cta') || CMS_DEFAULTS.membership_terms_cta}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
