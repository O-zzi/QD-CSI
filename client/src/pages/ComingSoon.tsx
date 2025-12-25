import { useState, useEffect } from "react";
import { Link } from "wouter";
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

import padelImage from "@assets/stock_images/padel_tennis_court_i_a0e484ae.jpg";
import squashImage from "@assets/stock_images/indoor_squash_court__c97e350b.jpg";
import renderExterior1 from "@assets/stock_images/architectural_render_b118ee78.jpg";
import renderExterior2 from "@assets/stock_images/architectural_render_cd4dce75.jpg";
import constructionCourt1 from "@assets/stock_images/sports_facility_cons_6b087ae8.jpg";

const carouselImages = [
  { src: renderExterior1, alt: "Complex Exterior Render", caption: "Premium Sports Complex Design" },
  { src: padelImage, alt: "Padel Tennis Courts", caption: "World-Class Padel Courts" },
  { src: squashImage, alt: "Squash Court", caption: "Professional Squash Facility" },
  { src: renderExterior2, alt: "Sports Arena", caption: "Modern Architecture" },
  { src: constructionCourt1, alt: "Construction Progress", caption: "Building Your Future" },
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
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        <header className="flex justify-center items-center mb-8">
          <span className="text-2xl font-bold text-white" data-testid="text-brand">
            {getValue('site_name') || CMS_DEFAULTS.site_name || 'The Quarterdeck'}
          </span>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          <div className="flex-1 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/90" data-testid="text-launch-badge">
                {getValue('hero_eyebrow') || CMS_DEFAULTS.hero_eyebrow}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight" data-testid="text-coming-soon-title">
              {getValue('coming_soon_title') || CMS_DEFAULTS.coming_soon_title}
            </h1>
            
            <p className="text-lg sm:text-xl text-white/80 mb-8" data-testid="text-coming-soon-subtitle">
              {getValue('coming_soon_subtitle') || CMS_DEFAULTS.coming_soon_subtitle}
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mb-10">
              <CountdownUnit value={timeLeft.days} label="Days" />
              <CountdownUnit value={timeLeft.hours} label="Hours" />
              <CountdownUnit value={timeLeft.minutes} label="Mins" />
              <CountdownUnit value={timeLeft.seconds} label="Secs" />
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0 mb-8">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  type="email"
                  placeholder="Enter your email for updates"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400 rounded-lg h-12"
                  data-testid="input-coming-soon-email"
                />
              </div>
              <Button 
                type="submit"
                className="h-12 px-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                disabled={subscribeMutation.isPending}
                data-testid="button-subscribe"
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Notify Me <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-white/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">{getValue('coming_soon_location') || CMS_DEFAULTS.coming_soon_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">6 AM - 10 PM Daily</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Padel Tennis', 'Squash', 'Air Rifle', 'Multipurpose Hall'].map((facility) => (
                <div key={facility} className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-sm">{facility}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 max-w-lg w-full">
            <Carousel 
              className="w-full"
              opts={{ loop: true }}
              plugins={[Autoplay({ delay: 4000 })]}
            >
              <CarouselContent>
                {carouselImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <Card className="border-0 bg-transparent">
                      <CardContent className="p-0">
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <span className="text-white font-medium text-lg">{image.caption}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="mt-6 flex justify-center gap-4">
              {/* Explore Full Site - enabled only after launch */}
              {isLaunched ? (
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 rounded-lg" 
                    data-testid="button-explore-site"
                  >
                    Explore Full Site
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="outline" 
                  className="border-white/20 text-white/50 rounded-lg cursor-not-allowed opacity-60" 
                  disabled
                  data-testid="button-explore-site"
                >
                  Explore Full Site
                </Button>
              )}
              <Link href="/roadmap">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg" data-testid="button-view-progress">
                  View Progress
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <footer className="mt-8 text-center text-white/50 text-sm">
          <p>2024-2026 The Quarterdeck. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
