import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, Users, Building2, Trophy, Heart, Shield } from "lucide-react";

export default function Vision() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[50vh] min-h-[400px] bg-[#2a4060] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-vision-title">Our Vision</h1>
          <p className="text-xl md:text-2xl max-w-3xl opacity-90" data-testid="text-vision-subtitle">
            Building Islamabad's premier sports and recreation destination
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <Link href="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-[#2a4060] mb-6" data-testid="text-mission-title">Our Mission</h2>
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
            <h2 className="text-3xl font-bold text-[#2a4060] mb-8" data-testid="text-values-title">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card data-testid="card-value-excellence">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-md bg-[#2a4060]/10 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-[#2a4060]" />
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
                    <div className="w-12 h-12 rounded-md bg-[#2a4060]/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-[#2a4060]" />
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
                    <div className="w-12 h-12 rounded-md bg-[#2a4060]/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-[#2a4060]" />
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
                    <div className="w-12 h-12 rounded-md bg-[#2a4060]/10 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-[#2a4060]" />
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
            <h2 className="text-3xl font-bold text-[#2a4060] mb-6" data-testid="text-future-title">Looking Ahead</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              With our Q4 2026 launch approaching, The Quarterdeck is set to transform the sports and 
              recreation landscape in Islamabad. Our founding members will be the first to experience 
              our world-class facilities and exclusive benefits.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/roadmap">
                <Button className="bg-[#2a4060] hover:bg-[#1e3048]" data-testid="button-view-roadmap">
                  <Building2 className="w-4 h-4 mr-2" /> View Our Roadmap
                </Button>
              </Link>
              <Link href="/#membership">
                <Button variant="outline" data-testid="button-become-member">
                  Become a Founding Member
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
