import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, HelpCircle, Calendar, Users, CreditCard, Clock, Building2, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: typeof HelpCircle;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "General",
    icon: HelpCircle,
    items: [
      {
        question: "What is The Quarterdeck?",
        answer: "The Quarterdeck is a premier sports and recreation complex in Islamabad, Pakistan, scheduled for launch in Q4 2026. We offer world-class facilities for various sports including Padel Tennis, Squash, Air Rifle Range, and more."
      },
      {
        question: "Where is The Quarterdeck located?",
        answer: "The Quarterdeck is located in Islamabad, Pakistan. Detailed address and directions will be provided closer to our launch date."
      },
      {
        question: "What are the operating hours?",
        answer: "We operate from 6:00 AM to 11:00 PM daily. Off-peak hours (10 AM - 5 PM) offer discounted rates for members."
      },
      {
        question: "Is parking available?",
        answer: "Yes, we provide ample free parking for all visitors and members at our facility."
      }
    ]
  },
  {
    title: "Membership",
    icon: Users,
    items: [
      {
        question: "What membership tiers are available?",
        answer: "We offer multiple membership tiers to suit different needs: Bronze, Silver, Gold, and Platinum. Each tier provides different benefits including booking discounts, guest passes, and priority access to facilities."
      },
      {
        question: "How do I become a member?",
        answer: "You can sign up for membership through our website. Create an account, choose your preferred membership tier, and complete the payment process. Our team will verify your details and activate your membership."
      },
      {
        question: "Can I upgrade or downgrade my membership?",
        answer: "Yes, you can change your membership tier at any time. Upgrades take effect immediately, while downgrades apply at your next billing cycle."
      },
      {
        question: "What discounts do members receive?",
        answer: "Members receive discounts on facility bookings, with higher tiers receiving greater discounts. Off-peak hour bookings (10 AM - 5 PM) provide additional savings for all members."
      },
      {
        question: "Can I bring guests?",
        answer: "Yes, depending on your membership tier, you receive a certain number of guest passes per month. Additional guest passes can be purchased separately."
      }
    ]
  },
  {
    title: "Bookings",
    icon: Calendar,
    items: [
      {
        question: "How do I book a facility?",
        answer: "Log in to your account, navigate to the Booking page, select your desired facility, date, and time slot, then confirm your booking. Payment can be made online or at the venue."
      },
      {
        question: "Can I cancel or reschedule a booking?",
        answer: "Yes, bookings can be cancelled or rescheduled up to 24 hours before the scheduled time. Cancellations made less than 24 hours in advance may incur a fee."
      },
      {
        question: "What is the booking duration for each facility?",
        answer: "Standard booking slots are typically 1 hour, though some facilities may offer 30-minute or 2-hour options. Check the specific facility details when making your booking."
      },
      {
        question: "Is there a limit on how many bookings I can make?",
        answer: "Regular users have reasonable limits to ensure fair access for all members. Premium members may have higher booking limits."
      }
    ]
  },
  {
    title: "Payment",
    icon: CreditCard,
    items: [
      {
        question: "What payment methods are accepted?",
        answer: "We accept bank transfers and cash payments at our facility. All payments are processed securely and receipts are provided for your records."
      },
      {
        question: "Is online payment available?",
        answer: "Currently, we support offline payment methods (bank transfer and cash) tailored for the Pakistan market. Online payment options may be added in the future."
      },
      {
        question: "How do I get a receipt for my payment?",
        answer: "Receipts are automatically generated and sent to your registered email address upon payment confirmation. You can also view your payment history in your profile."
      },
      {
        question: "What is your refund policy?",
        answer: "Refunds for cancelled bookings are processed within 7-10 business days. Membership refunds are prorated based on the remaining duration."
      }
    ]
  },
  {
    title: "Facilities",
    icon: Building2,
    items: [
      {
        question: "What facilities are available?",
        answer: "We offer Padel Tennis courts, Squash courts, Air Rifle Range, Multi-purpose halls, and more. Each facility is equipped with professional-grade equipment and maintained to the highest standards."
      },
      {
        question: "Do you provide equipment?",
        answer: "Basic equipment is available for rent at most facilities. We recommend bringing your own equipment for the best experience, especially for competitive play."
      },
      {
        question: "Are coaches or trainers available?",
        answer: "Yes, we offer coaching services and academies for various sports. Check our Events & Academies page for current programs and registration details."
      },
      {
        question: "Is the facility accessible for people with disabilities?",
        answer: "Yes, The Quarterdeck is designed to be fully accessible with ramps, elevators, and accessible facilities throughout the complex."
      }
    ]
  },
  {
    title: "Rules & Safety",
    icon: Shield,
    items: [
      {
        question: "What are the dress code requirements?",
        answer: "Appropriate athletic attire and non-marking sports shoes are required in all sports facilities. Specific dress codes may apply to certain areas."
      },
      {
        question: "Are there age restrictions for facilities?",
        answer: "Most facilities are open to all ages. However, some activities like the Air Rifle Range have minimum age requirements. Children under 12 must be accompanied by an adult."
      },
      {
        question: "What safety measures are in place?",
        answer: "We maintain strict safety protocols including trained staff, first aid facilities, CCTV monitoring, and regular equipment maintenance. All visitors must follow posted safety guidelines."
      },
      {
        question: "Can I host private events?",
        answer: "Yes, our facilities can be booked for private events, corporate functions, and tournaments. Contact us for special event inquiries and pricing."
      }
    ]
  }
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover-elevate"
        data-testid={`button-faq-${item.question.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="font-medium text-foreground pr-4">{item.question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-muted-foreground animate-qd-fade-in">
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryTitle: string, questionIndex: number) => {
    const key = `${categoryTitle}-${questionIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemOpen = (categoryTitle: string, questionIndex: number) => {
    const key = `${categoryTitle}-${questionIndex}`;
    return openItems[key] || false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary py-8 md:py-12">
          <div className="qd-container text-center text-primary-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-faq-title">
              Frequently Asked Questions
            </h1>
            <p className="text-sm opacity-80 max-w-2xl mx-auto">
              Find answers to common questions about The Quarterdeck, memberships, bookings, and more.
            </p>
          </div>
        </div>

        <PageBreadcrumb 
          items={[{ label: "FAQ" }]} 
        />

        <section className="py-12 md:py-16">
          <div className="qd-container">
            <div className="grid gap-8 md:grid-cols-2">
              {faqCategories.map((category) => (
                <Card key={category.title} className="overflow-visible" data-testid={`card-faq-${category.title.toLowerCase()}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-semibold">{category.title}</h2>
                    </div>
                    <div>
                      {category.items.map((item, index) => (
                        <FAQAccordion
                          key={index}
                          item={item}
                          isOpen={isItemOpen(category.title, index)}
                          onToggle={() => toggleItem(category.title, index)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Card className="inline-block overflow-visible">
                <CardContent className="p-8">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
                  <p className="text-muted-foreground mb-4">
                    Our team is here to help. Get in touch and we'll respond as soon as possible.
                  </p>
                  <Link href="/contact">
                    <Button data-testid="button-contact-us">Contact Us</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
