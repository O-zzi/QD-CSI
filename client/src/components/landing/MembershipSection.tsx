import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, Star, Sparkles, Users, ChevronDown, ChevronUp } from "lucide-react";
import membershipBg from "@assets/stock_images/modern_indoor_sports_8b182ff8.jpg";
import type { PricingTier } from "@shared/schema";

const tierIcons: Record<string, any> = {
  FOUNDING: Crown,
  GOLD: Star,
  SILVER: Sparkles,
  GUEST: Users,
};

const tierColors: Record<string, { bg: string; text: string }> = {
  FOUNDING: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  GOLD: { bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  SILVER: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  GUEST: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
};

const defaultMembershipTiers = [
  {
    id: "founding",
    name: "Founding Member",
    tier: "FOUNDING",
    tagline: "Limited & Exclusive",
    description: "For early supporters and investors who believe in our vision.",
    price: 35000,
    billingPeriod: "monthly",
    featured: true,
    closed: true,
    benefits: [
      "Lifetime priority booking (14-day window)",
      "25% discount on off-peak bookings (10 AM - 5 PM)",
      "10 guest passes per month",
      "Access to exclusive Bridge Room",
      "Permanent credit bonus (10%)",
      "VIP parking & locker",
      "Invitation to all exclusive events",
      "Founding member recognition wall",
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "gold",
    name: "Gold Membership",
    tier: "GOLD",
    tagline: "Premium Access",
    description: "For serious athletes and frequent players who want the best experience.",
    price: 15000,
    billingPeriod: "monthly",
    featured: false,
    closed: false,
    benefits: [
      "7-day advance booking window",
      "20% discount on off-peak bookings (10 AM - 5 PM)",
      "4 guest passes per month",
      "Priority event registration",
      "15% off coaching & clinics",
      "Free equipment rental (2x/month)",
      "Access to member lounge",
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "silver",
    name: "Silver Membership",
    tier: "SILVER",
    tagline: "Standard Access",
    description: "Perfect for recreational players who want regular access at great value.",
    price: 5000,
    billingPeriod: "monthly",
    featured: false,
    closed: false,
    benefits: [
      "5-day advance booking window",
      "10% discount on off-peak bookings (10 AM - 5 PM)",
      "2 guest passes per month",
      "10% off coaching & clinics",
      "Member newsletter & updates",
      "Discounted event entry",
    ],
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "guest",
    name: "Pay-to-Play",
    tier: "GUEST",
    tagline: "Non-Member Access",
    description: "Try our facilities without commitment. Subject to availability.",
    price: 0,
    billingPeriod: "per visit",
    featured: false,
    closed: false,
    benefits: [
      "2-day advance booking window",
      "Access after member priority",
      "Equipment rental available",
      "Guest registration required",
      "Can be upgraded to membership",
    ],
    isActive: true,
    sortOrder: 4,
  },
];

const comparisonFeatures = [
  { feature: "Advance Booking Window", founding: "14 days", gold: "7 days", silver: "5 days", guest: "2 days" },
  { feature: "Off-Peak Discount (10 AM - 5 PM)", founding: "25%", gold: "20%", silver: "10%", guest: "None" },
  { feature: "Monthly Guest Passes", founding: "10", gold: "4", silver: "2", guest: "N/A" },
  { feature: "Coaching Discount", founding: "20%", gold: "15%", silver: "10%", guest: "None" },
  { feature: "Event Priority", founding: "VIP", gold: "Priority", silver: "Standard", guest: "Last" },
];

export function MembershipSection() {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const { data: apiTiers, isLoading } = useQuery<PricingTier[]>({
    queryKey: ['/api/pricing-tiers'],
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
        tagline: tier.tier === 'FOUNDING' ? 'Limited & Exclusive' : 
                 tier.tier === 'GOLD' ? 'Premium Access' :
                 tier.tier === 'SILVER' ? 'Standard Access' : 'Non-Member Access',
        description: defaultMembershipTiers.find(d => d.tier === tier.tier)?.description || '',
        price: tier.price,
        billingPeriod: tier.billingPeriod || 'monthly',
        featured: tier.isPopular || tier.tier === 'FOUNDING',
        closed: tier.tier === 'FOUNDING',
        benefits: tier.benefits || [],
        isActive: tier.isActive,
        sortOrder: tier.sortOrder || 0,
      }));
  }, [apiTiers]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const toggleTier = (tierId: string) => {
    setExpandedTier(expandedTier === tierId ? null : tierId);
  };

  const formatPrice = (price: number, period: string) => {
    if (price === 0 || !price) {
      return { amount: "Standard", suffix: " rates" };
    }
    return { 
      amount: `PKR ${price.toLocaleString()}`, 
      suffix: period === 'yearly' ? '/year' : '/month' 
    };
  };

  if (isLoading) {
    return (
      <section id="membership" className="qd-section bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        <div className="qd-container relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border p-6 bg-white dark:bg-slate-800">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto mb-4" />
                <Skeleton className="h-8 w-28 mx-auto mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </div>
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
            <h2 className="qd-section-title" data-testid="text-membership-title">Membership & Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Choose the membership tier that fits your lifestyle. All members enjoy priority booking, 
              exclusive discounts during off-peak hours (10 AM - 5 PM), and access to our world-class facilities.
            </p>
          </div>
          <Button
            className="rounded-full"
            onClick={() => scrollToSection("contact")}
            data-testid="button-inquire-membership"
          >
            Inquire Now
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {membershipTiers.map((tier) => {
            const Icon = tierIcons[tier.tier] || Users;
            const colors = tierColors[tier.tier] || tierColors.GUEST;
            const isExpanded = expandedTier === tier.id;
            const hasMoreBenefits = tier.benefits.length > 5;
            const { amount, suffix } = formatPrice(tier.price, tier.billingPeriod);
            
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-6 bg-white dark:bg-slate-800 transition-all duration-300 ${
                  tier.featured 
                    ? 'border-amber-500/50 shadow-lg ring-2 ring-amber-500/20' 
                    : 'border-gray-200 dark:border-slate-700'
                } ${hasMoreBenefits ? 'cursor-pointer hover-elevate' : ''}`}
                onClick={() => hasMoreBenefits && toggleTier(tier.id)}
                data-testid={`membership-tier-${tier.tier.toLowerCase()}`}
              >
                {tier.closed && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    CLOSED
                  </div>
                )}
                {tier.featured && !tier.closed && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{tier.tagline}</p>
                </div>

                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">{amount}</span>
                  <span className="text-muted-foreground text-sm">{suffix}</span>
                </div>

                <p className="text-sm text-muted-foreground text-center mb-4">{tier.description}</p>

                <ul className="space-y-2 mb-4">
                  {(isExpanded ? tier.benefits : tier.benefits.slice(0, 5)).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {hasMoreBenefits && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTier(tier.id);
                    }}
                    className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground mb-4 py-2 rounded-lg transition-colors"
                    data-testid={`button-expand-${tier.tier.toLowerCase()}`}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        +{tier.benefits.length - 5} more benefits
                      </>
                    )}
                  </button>
                )}

                <Button 
                  variant={tier.featured ? "default" : "outline"} 
                  className="w-full rounded-full"
                  disabled={tier.closed}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!tier.closed) scrollToSection("contact");
                  }}
                  data-testid={`button-select-${tier.tier.toLowerCase()}`}
                >
                  {tier.closed ? "Not Available" : "Inquire Now"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 overflow-x-auto">
          <h3 className="font-bold text-lg mb-4 text-center">Quick Comparison</h3>
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-sm">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-amber-600">Founding</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-yellow-600">Gold</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-gray-500">Silver</th>
                <th className="text-center py-3 px-4 font-semibold text-sm text-blue-500">Guest</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-slate-700/50">
                  <td className="py-3 px-4 text-sm text-muted-foreground">{row.feature}</td>
                  <td className="py-3 px-4 text-sm text-center font-medium">{row.founding}</td>
                  <td className="py-3 px-4 text-sm text-center">{row.gold}</td>
                  <td className="py-3 px-4 text-sm text-center">{row.silver}</td>
                  <td className="py-3 px-4 text-sm text-center text-muted-foreground">{row.guest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Questions about membership? Contact us for more details or to discuss corporate packages.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => scrollToSection("contact")}
              data-testid="button-contact-membership"
            >
              Contact for Details
            </Button>
            <Link href="/terms">
              <Button variant="ghost" className="rounded-full text-muted-foreground" data-testid="button-view-terms-membership">
                View Terms & Conditions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
