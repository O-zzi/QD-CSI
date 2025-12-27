import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { ArrowRight, Calendar, Mail, MapPin, Clock, Loader2, CheckCircle } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import type { SiteImage } from "@shared/schema";

import padelImageDefault from "@assets/stock_images/padel_tennis_court_i_a0e484ae.jpg";
import squashImageDefault from "@assets/stock_images/indoor_squash_court__c97e350b.jpg";
import renderExterior1Default from "@assets/stock_images/architectural_render_b118ee78.jpg";
import renderExterior2Default from "@assets/stock_images/architectural_render_cd4dce75.jpg";
import constructionCourt1Default from "@assets/stock_images/sports_facility_cons_6b087ae8.jpg";

const defaultCarouselImages = [
  { key: "coming-soon-1", src: renderExterior1Default, alt: "Complex Exterior Render", caption: "Premium Sports Complex Design" },
  { key: "coming-soon-2", src: padelImageDefault, alt: "Padel Tennis Courts", caption: "World-Class Padel Courts" },
  { key: "coming-soon-3", src: squashImageDefault, alt: "Squash Court", caption: "Professional Squash Facility" },
  { key: "coming-soon-4", src: renderExterior2Default, alt: "Sports Arena", caption: "Modern Architecture" },
  { key: "coming-soon-5", src: constructionCourt1Default, alt: "Construction Progress", caption: "Building Your Future" },
];

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function ComingSoon() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLaunched, setIsLaunched] = useState(false);

  const { getValue } = useCmsMultiple([
    'coming_soon_title',
    'coming_soon_subtitle',
    'coming_soon_launch_date',
    'coming_soon_location',
    'site_name',
    'hero_eyebrow',
  ], CMS_DEFAULTS);

  const { data: siteImages = [] } = useQuery<SiteImage[]>({
    queryKey: ['/api/site-images', 'coming-soon'],
    queryFn: async () => {
      const res = await fetch('/api/site-images?page=coming-soon');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const carouselImages = useMemo(() => {
    return defaultCarouselImages.map(item => {
      const cmsImage = siteImages.find(img => img.section === item.key && img.isActive);
      return {
        ...item,
        src: cmsImage?.imageUrl || item.src,
        alt: cmsImage?.alt || item.alt,
        caption: cmsImage?.title || item.caption,
      };
    });
  }, [siteImages]);

  const launchDateStr = getValue('coming_soon_launch_date') || CMS_DEFAULTS.coming_soon_launch_date || '2026-10-01';
  const launchDate = new Date(launchDateStr);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +launchDate - +new Date();
      
      if (difference > 0) {
        setIsLaunched(false);
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      
      setIsLaunched(true);
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDateStr]);

  const subscribeMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      return await apiRequest("POST", "/api/contact", {
        name: "Early Interest Subscriber",
        email: emailAddress,
        subject: "Coming Soon - Early Interest",
        message: "I would like to receive updates about The Quarterdeck launch.",
      });
    },
    onSuccess: () => {
      toast({
        title: "Successfully Subscribed",
        description: "You'll be the first to know when we launch!",
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribeMutation.mutate(email);
    }
  };

  const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
        <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="mt-2 text-sm sm:text-base text-white/80 uppercase tracking-widest font-medium">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a2a40] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10">
        <header className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur">
                  <span className="text-xl font-bold text-white">Q</span>
                </div>
                <span className="text-xl font-semibold text-white hidden sm:block">
                  {getValue('site_name') || CMS_DEFAULTS.site_name}
                </span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" className="text-white border-white/30 bg-white/10 backdrop-blur-sm">
                Full Website <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-block px-4 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-sm font-medium">
                  {getValue('hero_eyebrow') || CMS_DEFAULTS.hero_eyebrow}
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {getValue('coming_soon_title') || CMS_DEFAULTS.coming_soon_title}
                </h1>
                <p className="text-lg text-white/70 max-w-lg">
                  {getValue('coming_soon_subtitle') || CMS_DEFAULTS.coming_soon_subtitle}
                </p>
              </div>

              <div className="flex items-center gap-4 text-white/70">
                <MapPin className="w-5 h-5" />
                <span>{getValue('coming_soon_location') || CMS_DEFAULTS.coming_soon_location || 'Islamabad, Pakistan'}</span>
              </div>

              {!isLaunched ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="w-5 h-5" />
                    <span>Expected Launch: Q4 2026</span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 md:gap-6">
                    <CountdownUnit value={timeLeft.days} label="Days" />
                    <CountdownUnit value={timeLeft.hours} label="Hours" />
                    <CountdownUnit value={timeLeft.minutes} label="Mins" />
                    <CountdownUnit value={timeLeft.seconds} label="Secs" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400 text-xl">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">We're Live!</span>
                </div>
              )}

              <Card className="bg-white/10 border-white/20 backdrop-blur">
                <CardContent className="p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Get Early Access Updates
                  </h3>
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      required
                      data-testid="input-email-subscribe"
                    />
                    <Button 
                      type="submit" 
                      disabled={subscribeMutation.isPending}
                      className="bg-amber-500 text-white"
                      data-testid="button-subscribe"
                    >
                      {subscribeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Notify Me"
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-white/50 mt-3">
                    Join the waitlist for exclusive pre-launch offers and founding member benefits.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:pl-8">
              <Carousel
                opts={{ loop: true }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent>
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <p className="text-white font-medium text-lg">{image.caption}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </main>

        <footer className="container mx-auto px-6 py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm">
              2024-2027 The Quarterdeck. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-white/50 text-sm">
              <Clock className="w-4 h-4" />
              <span>Pre-launch Phase</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
