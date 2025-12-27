import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Testimonial } from "@shared/schema";

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  showFeaturedOnly?: boolean;
  maxItems?: number;
}

export function TestimonialsSection({ 
  title = "What Our Members Say",
  subtitle = "Hear from the people who make The Quarterdeck special",
  showFeaturedOnly = false,
  maxItems = 6 
}: TestimonialsSectionProps) {
  const endpoint = showFeaturedOnly ? "/api/testimonials/featured" : "/api/testimonials";
  
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: [endpoint],
  });

  const displayTestimonials = testimonials?.slice(0, maxItems) || [];

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayTestimonials.length) {
    return null;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
      />
    ));
  };

  return (
    <section className="py-16 bg-muted/30" data-testid="section-testimonials">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-testimonials-title">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-testimonials-subtitle">
            {subtitle}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayTestimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="bg-card hover-elevate transition-all"
              data-testid={`card-testimonial-${testimonial.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating || 5)}
                </div>
                
                <div className="relative mb-6">
                  <Quote className="absolute -top-2 -left-1 w-6 h-6 text-primary/20" />
                  <p className="text-muted-foreground pl-5 italic">
                    "{testimonial.quote}"
                  </p>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatarUrl || undefined} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    {(testimonial.title || testimonial.company) && (
                      <p className="text-sm text-muted-foreground">
                        {testimonial.title}
                        {testimonial.title && testimonial.company && " at "}
                        {testimonial.company}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
