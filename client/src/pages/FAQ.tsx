import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, HelpCircle, Calendar, Users, CreditCard, Clock, Building2, Shield, Settings, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import type { FaqCategory, FaqItem } from "@shared/schema";

interface FAQCategoryWithItems extends FaqCategory {
  items: FaqItem[];
}

const iconMap: Record<string, typeof HelpCircle> = {
  "help-circle": HelpCircle,
  "users": Users,
  "calendar": Calendar,
  "credit-card": CreditCard,
  "clock": Clock,
  "building-2": Building2,
  "shield": Shield,
  "settings": Settings,
};

function FAQAccordion({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover-elevate"
        data-testid={`button-faq-${item.id}`}
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

  const { getValue } = useCmsMultiple([
    'page_faq_title',
    'page_faq_subtitle',
    'page_faq_contact_cta',
  ], CMS_DEFAULTS);

  const { data: faqData = [], isLoading } = useQuery<FAQCategoryWithItems[]>({
    queryKey: ["/api/faq"],
  });

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getIcon = (iconName: string | null) => {
    return iconMap[iconName || "help-circle"] || HelpCircle;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title={getValue('page_faq_title')}
          subtitle={getValue('page_faq_subtitle')}
          testId="text-faq-title"
        />

        <section className="py-12 md:py-16">
          <div className="qd-container max-w-5xl mx-auto">
            <PageBreadcrumb 
              items={[{ label: "FAQ" }]} 
            />
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : faqData.length === 0 ? (
              <Card className="overflow-visible">
                <CardContent className="py-12 text-center">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No FAQs Available</h3>
                  <p className="text-muted-foreground">Check back later for frequently asked questions.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {faqData.map((category) => {
                  const IconComponent = getIcon(category.icon);
                  return (
                    <Card key={category.id} className="overflow-visible" data-testid={`card-faq-${category.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <h2 className="text-lg font-semibold">{category.title}</h2>
                        </div>
                        <div>
                          {category.items.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No questions in this category yet.</p>
                          ) : (
                            category.items.map((item) => (
                              <FAQAccordion
                                key={item.id}
                                item={item}
                                isOpen={openItems[item.id] || false}
                                onToggle={() => toggleItem(item.id)}
                              />
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

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
