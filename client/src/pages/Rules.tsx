import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Users, AlertTriangle, Shirt, Phone, Ban, Heart, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import type { Rule } from "@shared/schema";

const categoryConfig: Record<string, { title: string; icon: any }> = {
  general: { title: "General Rules", icon: Shield },
  booking: { title: "Booking & Scheduling", icon: Clock },
  conduct: { title: "Conduct & Behavior", icon: Users },
  safety: { title: "Safety Requirements", icon: AlertTriangle },
  dresscode: { title: "Dress Code", icon: Shirt },
  equipment: { title: "Equipment & Facilities", icon: Ban },
  guests: { title: "Guest Policy", icon: Heart },
  emergency: { title: "Emergency Procedures", icon: Phone },
};

const categoryOrder = ["general", "booking", "conduct", "safety", "dresscode", "equipment", "guests", "emergency"];

export default function Rules() {
  const { data: rules = [], isLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });

  const groupedRules = rules.reduce((acc, rule) => {
    const category = rule.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  const sortedCategories = categoryOrder.filter(cat => groupedRules[cat]?.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary py-8 md:py-12">
          <div className="qd-container text-center text-primary-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-rules-title">Rules & Safety</h1>
            <p className="text-sm opacity-80 max-w-2xl mx-auto">
              For the safety and enjoyment of all members, please familiarize yourself with our facility rules
            </p>
          </div>
        </div>

        <div className="qd-container py-8">
          <PageBreadcrumb />
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

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sortedCategories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Rules are being updated. Please check back soon.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {sortedCategories.map((categoryKey) => {
                  const config = categoryConfig[categoryKey] || { title: categoryKey, icon: Shield };
                  const Icon = config.icon;
                  const categoryRules = groupedRules[categoryKey] || [];
                  
                  return (
                    <AccordionItem 
                      key={categoryKey} 
                      value={categoryKey} 
                      className="border rounded-md px-4"
                      data-testid={`accordion-${categoryKey}`}
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-primary/10 dark:bg-sky-400/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary dark:text-sky-400" />
                          </div>
                          <span className="font-semibold">{config.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-3 pl-13 py-4">
                          {categoryRules.map((rule, index) => (
                            <li key={rule.id} className="flex items-start gap-3 text-muted-foreground">
                              <span className="text-primary dark:text-sky-400 font-bold">{index + 1}.</span>
                              <div>
                                {rule.title && <span className="font-medium text-foreground">{rule.title}: </span>}
                                {rule.content}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

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
                  <Link href="/contact">
                    <Button data-testid="button-contact-us">
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
      </main>

      <Footer />
    </div>
  );
}
