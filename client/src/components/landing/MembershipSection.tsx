import { Button } from "@/components/ui/button";

const membershipTiers = [
  {
    id: "founding",
    name: "Founding Member Tier (Closed)",
    description: "Exclusive benefits for early investors/supporters. Includes Lifetime Priority Booking and permanent credit bonuses.",
    price: "PKR 35,000/mo equivalent",
    tier: "founding",
  },
  {
    id: "gold",
    name: "Gold Membership (Premium)",
    description: "Premium access tier: 7-day advance booking window, 20% discount on court bookings, 4 free guest passes per month.",
    price: "PKR 15,000/mo est.",
    tier: "gold",
  },
  {
    id: "silver",
    name: "Silver Membership (Standard)",
    description: "Standard access tier: 5-day advance booking window, 10% discount on off-peak bookings, discounted clinic rates.",
    price: "PKR 5,000/mo est.",
    tier: "silver",
  },
  {
    id: "guest",
    name: "Non-Member Pay-to-Play",
    description: "Guests can play at the standard rate (no discount), with a 2-day advance booking window. Subject to availability after member priority booking.",
    price: "Standard rates",
    tier: "guest",
  },
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
    <section id="membership" className="qd-section bg-gray-50 dark:bg-slate-900">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-membership-title">Membership & Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              Membership tiers will offer exclusive benefits, early booking access, and discounts on court time and coaching. Join our waitlist to be notified of pricing models.
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

        <div className="qd-rules-grid">
          {membershipTiers.map((tier) => (
            <div
              key={tier.id}
              className={`qd-rule-item qd-membership ${tier.tier}`}
              data-tier={tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
              data-testid={`membership-tier-${tier.id}`}
            >
              <h4 className="font-bold text-foreground mb-2">{tier.name}</h4>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
              <p className="text-xs text-muted-foreground mt-2 font-semibold">({tier.price})</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
