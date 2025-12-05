import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Clock, Users, AlertTriangle, Shirt, Phone, Ban, Heart } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ruleCategories = [
  {
    id: "general",
    title: "General Rules",
    icon: Shield,
    rules: [
      "All members and guests must check in at reception upon arrival",
      "Valid membership cards must be presented when requested by staff",
      "Children under 16 must be accompanied by a member at all times",
      "Photography and video recording require prior management approval",
      "Lost and found items should be reported to reception immediately",
      "Management reserves the right to refuse entry or ask anyone to leave",
    ],
  },
  {
    id: "booking",
    title: "Booking & Scheduling",
    icon: Clock,
    rules: [
      "Bookings must be made through the official booking system or app",
      "Maximum booking window: 7 days in advance for Founding members, 3 days for others",
      "Cancellations must be made at least 24 hours before the scheduled time",
      "No-shows will result in forfeiture of booking credits and potential penalties",
      "Late arrivals: 15-minute grace period, after which the booking may be released",
      "Back-to-back bookings by the same member require a 30-minute gap",
    ],
  },
  {
    id: "conduct",
    title: "Conduct & Behavior",
    icon: Users,
    rules: [
      "Respectful behavior towards all staff, members, and guests is mandatory",
      "Harassment, discrimination, or intimidation of any kind is prohibited",
      "Excessive noise, profanity, and disruptive behavior are not permitted",
      "Mobile phones must be on silent in all playing areas",
      "Gambling or betting on premises is strictly prohibited",
      "Any disputes should be reported to management for resolution",
    ],
  },
  {
    id: "safety",
    title: "Safety Requirements",
    icon: AlertTriangle,
    rules: [
      "All members must complete facility-specific safety orientations",
      "Air Rifle Range requires mandatory safety certification before use",
      "Protective equipment must be worn as required for each facility",
      "Report any injuries, accidents, or safety hazards immediately",
      "Emergency exits must be kept clear at all times",
      "Fire alarms and safety equipment are for emergencies only",
    ],
  },
  {
    id: "dresscode",
    title: "Dress Code",
    icon: Shirt,
    rules: [
      "Appropriate athletic attire required for all sports facilities",
      "Non-marking indoor shoes mandatory for Padel and Squash courts",
      "Proper enclosed footwear required in Air Rifle Range",
      "Smart casual dress code in Bridge Room and common areas",
      "Swimming attire only permitted in designated areas (future)",
      "Offensive or inappropriate clothing will not be permitted",
    ],
  },
  {
    id: "equipment",
    title: "Equipment & Facilities",
    icon: Ban,
    rules: [
      "Handle all equipment with care; damage may result in charges",
      "Return rented equipment in the same condition as received",
      "Personal equipment must meet safety standards and be approved",
      "Do not leave personal belongings unattended in facility areas",
      "Report any equipment malfunctions to staff immediately",
      "Outside food and beverages not permitted in playing areas",
    ],
  },
  {
    id: "guests",
    title: "Guest Policy",
    icon: Heart,
    rules: [
      "Guest passes subject to availability based on membership tier",
      "Members are responsible for their guests' conduct at all times",
      "Guests must complete registration and sign waivers before facility use",
      "Same guest may visit maximum 3 times before membership required",
      "Guest fees apply as per current pricing schedule",
      "Corporate members have separate guest allocation policies",
    ],
  },
  {
    id: "emergency",
    title: "Emergency Procedures",
    icon: Phone,
    rules: [
      "In case of fire, evacuate via nearest exit and assemble at designated point",
      "Medical emergencies: Contact reception or any staff member immediately",
      "First aid kits available at reception and all facility areas",
      "Emergency contact numbers posted at all facility entrances",
      "Do not re-enter building until all-clear is given by staff",
      "AED (Automated External Defibrillator) located at main reception",
    ],
  },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#2a4060] py-16">
        <div className="container mx-auto px-6 text-center text-white">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-rules-title">Rules & Safety</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            For the safety and enjoyment of all members, please familiarize yourself with our facility rules
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Important Safety Notice</h3>
                  <p className="text-muted-foreground">
                    Certain facilities require mandatory safety certifications before use. 
                    The Air Rifle Range requires completion of our safety course. Please contact 
                    reception to schedule your certification session.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Accordion type="multiple" className="space-y-4">
            {ruleCategories.map((category) => {
              const Icon = category.icon;
              return (
                <AccordionItem 
                  key={category.id} 
                  value={category.id} 
                  className="border rounded-md px-4"
                  data-testid={`accordion-${category.id}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[#2a4060]/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#2a4060]" />
                      </div>
                      <span className="font-semibold">{category.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pl-13 py-4">
                      {category.rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-3 text-muted-foreground">
                          <span className="text-[#2a4060] font-bold">{index + 1}.</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Questions About Our Rules?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about our rules and policies, or need clarification 
                on any point, please don't hesitate to contact us.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/#contact">
                  <Button className="bg-[#2a4060] hover:bg-[#1e3048]" data-testid="button-contact-us">
                    Contact Us
                  </Button>
                </Link>
                <Link href="/terms">
                  <Button variant="outline" data-testid="button-view-terms">
                    View Terms & Conditions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
