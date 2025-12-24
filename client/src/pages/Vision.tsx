import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, Trophy, Heart, Shield, Building2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";

export default function Vision() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title="Our Vision"
          subtitle="Building Islamabad's premier sports and recreation destination"
          testId="text-vision-title"
          subtitleTestId="text-vision-subtitle"
        />

        <div className="qd-container py-16">
          <div className="max-w-4xl mx-auto">
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-primary dark:text-sky-400 mb-6" data-testid="text-mission-title">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                The Quarterdeck aims to create a world-class sports and recreation complex that brings together 
                Islamabad's community through premium facilities, professional coaching, and a commitment to 
                excellence in every aspect of the member experience.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that access to quality sports facilities should be available to all who seek it, 
                and we're building a space where professionals, families, and enthusiasts can pursue their 
                passion for sports in a safe, welcoming environment.
              </p>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl font-bold text-primary dark:text-sky-400 mb-8" data-testid="text-values-title">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card data-testid="card-value-excellence">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-sky-400/10 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 text-primary dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Excellence</h3>
                        <p className="text-muted-foreground">
                          We strive for excellence in our facilities, services, and member experiences.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-value-community">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-sky-400/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Community</h3>
                        <p className="text-muted-foreground">
                          Building connections through sports and shared experiences.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-value-integrity">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-sky-400/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Safety & Integrity</h3>
                        <p className="text-muted-foreground">
                          Maintaining the highest standards of safety and ethical conduct.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-value-wellness">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-md bg-primary/10 dark:bg-sky-400/10 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-6 h-6 text-primary dark:text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Wellness</h3>
                        <p className="text-muted-foreground">
                          Promoting physical and mental well-being through active lifestyles.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-16">
              <h2 className="text-3xl font-bold text-primary dark:text-sky-400 mb-6" data-testid="text-future-title">Looking Ahead</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                With our Q4 2026 launch approaching, The Quarterdeck is set to transform the sports and 
                recreation landscape in Islamabad. Our early members will be the first to experience 
                our world-class facilities and exclusive benefits.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/roadmap">
                  <Button data-testid="button-view-roadmap">
                    <Building2 className="w-4 h-4 mr-2" /> View Our Roadmap
                  </Button>
                </Link>
                <Link href="/facilities">
                  <Button variant="outline" data-testid="button-explore-facilities">
                    Explore Facilities
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
