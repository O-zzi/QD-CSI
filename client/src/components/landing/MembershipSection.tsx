import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Crown, Star, Sparkles, Users } from "lucide-react";
import membershipBg from "@assets/stock_images/modern_indoor_sports_8b182ff8.jpg";

const membershipTiers = [
  {
    id: "founding",
    name: "Founding Member",
    tagline: "Limited & Exclusive",
    description: "For early supporters and investors who believe in our vision.",
    price: "PKR 35,000",
    period: "/month",
    tier: "founding",
    icon: Crown,
    featured: true,
    closed: true,
    benefits: [
      "Lifetime priority booking (14-day window)",
      "25% discount on all court bookings",
      "10 guest passes per month",
      "Access to exclusive Bridge Room",
      "Permanent credit bonus (10%)",
      "VIP parking & locker",
      "Invitation to all exclusive events",
      "Founding member recognition wall",
    ],
  },
  {
    id: "gold",
    name: "Gold Membership",
    tagline: "Premium Access",
    description: "For serious athletes and frequent players who want the best experience.",
    price: "PKR 15,000",
    period: "/month",
    tier: "gold",
    icon: Star,
    featured: false,
    closed: false,
    benefits: [
      "7-day advance booking window",
      "20% discount on all court bookings",
      "4 guest passes per month",
      "Priority event registration",
      "15% off coaching & clinics",
      "Free equipment rental (2x/month)",
      "Access to member lounge",
    ],
  },
  {
    id: "silver",
    name: "Silver Membership",
    tagline: "Standard Access",
    description: "Perfect for recreational players who want regular access at great value.",
    price: "PKR 5,000",
    period: "/month",
    tier: "silver",
    icon: Sparkles,
    featured: false,
    closed: false,
    benefits: [
      "5-day advance booking window",
      "10% discount on off-peak bookings",
      "2 guest passes per month",
      "10% off coaching & clinics",
      "Member newsletter & updates",
      "Discounted event entry",
    ],
  },
  {
    id: "guest",
    name: "Pay-to-Play",
    tagline: "Non-Member Access",
    description: "Try our facilities without commitment. Subject to availability.",
    price: "Standard",
    period: " rates",
    tier: "guest",
    icon: Users,
    featured: false,
    closed: false,
    benefits: [
      "2-day advance booking window",
      "Access after member priority",
      "Equipment rental available",
      "Guest registration required",
      "Can be upgraded to membership",
    ],
  },
];

const comparisonFeatures = [
  { feature: "Advance Booking Window", founding: "14 days", gold: "7 days", silver: "5 days", guest: "2 days" },
  { feature: "Court Booking Discount", founding: "25%", gold: "20%", silver: "10% off-peak", guest: "None" },
  { feature: "Monthly Guest Passes", founding: "10", gold: "4", silver: "2", guest: "N/A" },
  { feature: "Coaching Discount", founding: "20%", gold: "15%", silver: "10%", guest: "None" },
  { feature: "Event Priority", founding: "VIP", gold: "Priority", silver: "Standard", guest: "Last" },
];

export function MembershipSection() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

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
              exclusive discounts, and access to our world-class facilities.
            </p>
          </div>
          <Button
            className="rounded-full"
            onClick={() => scrollToSection("contact")}
            data-testid="button-join-waitlist"
          >
            Join Waitlist
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {membershipTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-6 bg-white dark:bg-slate-800 ${
                  tier.featured 
                    ? 'border-amber-500/50 shadow-lg ring-2 ring-amber-500/20' 
                    : 'border-gray-200 dark:border-slate-700'
                }`}
                data-testid={`membership-tier-${tier.id}`}
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
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    tier.id === 'founding' ? 'bg-amber-500/10' :
                    tier.id === 'gold' ? 'bg-yellow-500/10' :
                    tier.id === 'silver' ? 'bg-gray-500/10' : 'bg-blue-500/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      tier.id === 'founding' ? 'text-amber-500' :
                      tier.id === 'gold' ? 'text-yellow-600' :
                      tier.id === 'silver' ? 'text-gray-500' : 'text-blue-500'
                    }`} />
                  </div>
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{tier.tagline}</p>
                </div>

                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>

                <p className="text-sm text-muted-foreground text-center mb-4">{tier.description}</p>

                <ul className="space-y-2 mb-6">
                  {tier.benefits.slice(0, 5).map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                  {tier.benefits.length > 5 && (
                    <li className="text-sm text-muted-foreground text-center">
                      +{tier.benefits.length - 5} more benefits
                    </li>
                  )}
                </ul>

                <Button 
                  variant={tier.featured ? "default" : "outline"} 
                  className="w-full rounded-full"
                  disabled={tier.closed}
                  onClick={() => !tier.closed && scrollToSection("contact")}
                  data-testid={`button-select-${tier.id}`}
                >
                  {tier.closed ? "Waitlist Closed" : "Join Waitlist"}
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
