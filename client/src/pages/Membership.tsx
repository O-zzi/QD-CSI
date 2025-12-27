import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, Star, Sparkles, Users, ChevronDown, ChevronUp, Award, Clock, Gift, Shield, Target, Zap, Heart, Ticket, Calendar, Trophy, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { MembershipApplicationForm } from "@/components/membership/MembershipApplicationForm";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/use-seo";
import type { PricingTier, Membership, ComparisonFeature, MemberBenefit } from "@shared/schema";

const benefitIconMap: Record<string, any> = {
  clock: Clock,
  gift: Gift,
  award: Award,
  shield: Shield,
  target: Target,
  zap: Zap,
  heart: Heart,
  ticket: Ticket,
  calendar: Calendar,
  trophy: Trophy,
  star: Star,
  crown: Crown,
  users: Users,
  check: Check,
};

const tierIcons: Record<string, any> = {
  FOUNDING: Crown,
  GOLD: Star,
  SILVER: Sparkles,
  GUEST: Users,
};

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  FOUNDING: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  GOLD: { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  SILVER: { bg: 'bg-gray-500/10 dark:bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30' },
  GUEST: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
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

const defaultComparisonFeatures = [
  { feature: "Advance Booking Window", foundingValue: "14 days", goldValue: "7 days", silverValue: "5 days", guestValue: "2 days" },
  { feature: "Off-Peak Discount (10 AM - 5 PM)", foundingValue: "25%", goldValue: "20%", silverValue: "10%", guestValue: "None" },
  { feature: "Monthly Guest Passes", foundingValue: "10", goldValue: "4", silverValue: "2", guestValue: "N/A" },
  { feature: "Coaching Discount", foundingValue: "20%", goldValue: "15%", silverValue: "10%", guestValue: "None" },
  { feature: "Event Priority", foundingValue: "VIP", goldValue: "Priority", silverValue: "Standard", guestValue: "Last" },
];

const defaultMemberBenefits = [
  { icon: "clock", title: "Priority Booking", description: "Book your preferred time slots ahead of non-members" },
  { icon: "gift", title: "Exclusive Discounts", description: "Save on bookings, events, and coaching sessions" },
  { icon: "award", title: "Guest Passes", description: "Share the experience with friends and family" },
  { icon: "shield", title: "Member-Only Events", description: "Access exclusive tournaments and social gatherings" },
];

export default function Membership() {
  useSEO({
    title: "Membership Plans",
    description: "Join The Quarterdeck with exclusive membership tiers - Founding, Gold, Silver, and Guest. Enjoy priority booking, discounts, and premium benefits at Islamabad's premier sports complex.",
  });

  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: userMembership } = useQuery<Membership>({
    queryKey: ['/api/memberships/my'],
    enabled: isAuthenticated,
  });

  const handleJoinClick = (tier: any) => {
    if (!isAuthenticated) {
      setLocation(`/signup?redirect=/membership&tier=${tier.tier}`);
    } else if (userMembership) {
      setLocation('/profile?tab=membership');
    } else {
      setLocation(`/contact?subject=Membership%20Application%20-%20${tier.name}`);
    }
  };

  const { getValue } = useCmsMultiple([
    'page_membership_title',
    'page_membership_subtitle',
    'page_membership_why_title',
    'page_membership_why_description',
    'page_membership_tiers_title',
    'page_membership_tiers_description',
    'page_membership_ready_title',
    'page_membership_ready_description',
    'page_membership_create_cta',
    'page_membership_contact_cta',
  ], CMS_DEFAULTS);

  const { data: apiTiers, isLoading } = useQuery<PricingTier[]>({
    queryKey: ['/api/pricing-tiers'],
    queryFn: async () => {
      const res = await fetch('/api/pricing-tiers');
      if (!res.ok) throw new Error('Failed to fetch pricing tiers');
      return res.json();
    },
  });

  const { data: apiComparisonFeatures } = useQuery<ComparisonFeature[]>({
    queryKey: ['/api/comparison-features'],
  });

  const { data: apiMemberBenefits } = useQuery<MemberBenefit[]>({
    queryKey: ['/api/member-benefits'],
  });

  const comparisonFeatures = useMemo(() => {
    if (apiComparisonFeatures && apiComparisonFeatures.length > 0) {
      return apiComparisonFeatures;
    }
    return defaultComparisonFeatures;
  }, [apiComparisonFeatures]);

  const memberBenefits = useMemo(() => {
    if (apiMemberBenefits && apiMemberBenefits.length > 0) {
      return apiMemberBenefits;
    }
    return defaultMemberBenefits;
  }, [apiMemberBenefits]);

  const tiers = useMemo(() => {
    if (apiTiers && apiTiers.length > 0) {
      return apiTiers
        .filter(t => t.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(t => ({
          ...t,
          tagline: t.tier === 'FOUNDING' ? 'Limited & Exclusive' :
                   t.tier === 'GOLD' ? 'Premium Access' :
                   t.tier === 'SILVER' ? 'Standard Access' : 'Non-Member Access',
          closed: t.tier === 'FOUNDING',
        }));
    }
    return defaultMembershipTiers;
  }, [apiTiers]);

  const toggleTier = (tierId: string) => {
    setExpandedTier(expandedTier === tierId ? null : tierId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title={getValue('page_membership_title')}
          subtitle={getValue('page_membership_subtitle')}
          testId="text-membership-title"
        />

        <div className="qd-container py-8">
          <PageBreadcrumb />

          <section className="mt-8 mb-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{getValue('page_membership_why_title')}</h2>
              <p className="text-muted-foreground">
                {getValue('page_membership_why_description')}
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {memberBenefits.map((benefit, index) => {
                const IconComponent = benefitIconMap[benefit.icon?.toLowerCase() || 'check'] || HelpCircle;
                return (
                  <Card key={index} className="text-center" data-testid={`card-benefit-${index}`}>
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{getValue('page_membership_tiers_title')}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {getValue('page_membership_tiers_description')}
              </p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-10 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {tiers.map((tier: any) => {
                  const Icon = tierIcons[tier.tier] || Star;
                  const colors = tierColors[tier.tier] || tierColors.SILVER;
                  const isExpanded = expandedTier === tier.id;

                  return (
                    <Card 
                      key={tier.id} 
                      className={`relative overflow-visible ${tier.featured ? 'ring-2 ring-primary' : ''}`}
                      data-testid={`card-tier-${tier.tier?.toLowerCase()}`}
                    >
                      {tier.featured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                      )}
                      {tier.closed && (
                        <div className="absolute -top-3 right-4">
                          <span className="bg-destructive text-destructive-foreground text-xs font-medium px-3 py-1 rounded-full">
                            Closed
                          </span>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <h3 className="font-bold text-lg mb-1">{tier.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4">{tier.tagline}</p>
                        
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            {tier.price === 0 ? 'Free' : `PKR ${tier.price.toLocaleString()}`}
                          </span>
                          {tier.price > 0 && (
                            <span className="text-sm text-muted-foreground">/{tier.billingPeriod}</span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                        <button
                          onClick={() => toggleTier(tier.id)}
                          className="flex items-center gap-1 text-sm text-primary hover:underline mb-4"
                          data-testid={`button-toggle-benefits-${tier.tier?.toLowerCase()}`}
                        >
                          {isExpanded ? 'Hide' : 'View'} Benefits
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <ul className="space-y-2 mb-4 animate-qd-fade-in">
                            {tier.benefits?.map((benefit: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {tier.closed ? (
                          <Button variant="secondary" className="w-full" disabled>
                            Registration Closed
                          </Button>
                        ) : (
                          <Button 
                            variant={tier.featured ? "default" : "outline"} 
                            className="w-full"
                            onClick={() => handleJoinClick(tier)}
                            data-testid={`button-join-${tier.tier?.toLowerCase()}`}
                          >
                            {!isAuthenticated 
                              ? (tier.price === 0 ? 'Register Free' : 'Join Now')
                              : userMembership 
                                ? 'View My Membership'
                                : 'Apply for Membership'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-16 max-w-5xl mx-auto">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 text-lg font-semibold mx-auto mb-6 hover:text-primary transition-colors"
              data-testid="button-toggle-comparison"
            >
              Compare Membership Tiers
              {showComparison ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showComparison && (
              <Card className="overflow-visible animate-qd-fade-in">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium">Feature</th>
                          <th className="text-center p-4 font-medium text-amber-600 dark:text-amber-400">Founding</th>
                          <th className="text-center p-4 font-medium text-yellow-600 dark:text-yellow-400">Gold</th>
                          <th className="text-center p-4 font-medium text-gray-600 dark:text-gray-400">Silver</th>
                          <th className="text-center p-4 font-medium text-blue-600 dark:text-blue-400">Guest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFeatures.map((row, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="p-4 text-sm">{row.feature}</td>
                            <td className="text-center p-4 text-sm font-medium">{row.foundingValue}</td>
                            <td className="text-center p-4 text-sm font-medium">{row.goldValue}</td>
                            <td className="text-center p-4 text-sm font-medium">{row.silverValue}</td>
                            <td className="text-center p-4 text-sm font-medium">{row.guestValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {isAuthenticated && !userMembership && (
            <section className="mb-16 max-w-xl mx-auto" id="apply">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Apply for Membership</h2>
                <p className="text-muted-foreground">
                  Complete your application and start enjoying member benefits today
                </p>
              </div>
              <MembershipApplicationForm />
            </section>
          )}

          <section className="text-center max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">{getValue('page_membership_ready_title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {getValue('page_membership_ready_description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!isAuthenticated ? (
                    <Link href="/signup?redirect=/membership">
                      <Button data-testid="button-create-account">{getValue('page_membership_create_cta')}</Button>
                    </Link>
                  ) : userMembership ? (
                    <Link href="/profile?tab=membership">
                      <Button data-testid="button-view-my-membership">View My Membership</Button>
                    </Link>
                  ) : (
                    <Button onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-apply-membership">Apply for Membership</Button>
                  )}
                  <Link href="/contact">
                    <Button variant="outline" data-testid="button-contact-membership">{getValue('page_membership_contact_cta')}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
