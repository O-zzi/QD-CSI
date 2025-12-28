import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageHero } from "@/components/layout/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Quote } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import type { Testimonial } from "@shared/schema";

export default function TestimonialsPage() {
  useSEO({
    title: "Testimonials",
    description: "Read what our members say about The Quarterdeck. Discover why we're Islamabad's premier sports and recreation complex.",
  });

  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  const featuredTestimonials = testimonials?.filter(t => t.isFeatured) || [];
  const regularTestimonials = testimonials?.filter(t => !t.isFeatured) || [];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title="What Our Members Say"
          subtitle="Hear from our community about their experience at The Quarterdeck"
          testId="text-testimonials-title"
        />

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-3 mt-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : testimonials?.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
              <p className="text-muted-foreground">
                We're collecting feedback from our members. Check back soon!
              </p>
            </div>
          ) : (
            <>
              {featuredTestimonials.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Featured Reviews
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {featuredTestimonials.map((testimonial) => (
                      <TestimonialCard key={testimonial.id} testimonial={testimonial} featured />
                    ))}
                  </div>
                </div>
              )}

              {regularTestimonials.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Member Reviews</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularTestimonials.map((testimonial) => (
                      <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function TestimonialCard({ testimonial, featured = false }: { testimonial: Testimonial; featured?: boolean }) {
  const renderStars = (rating: number | null) => {
    const stars = rating || 5;
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
      />
    ));
  };

  return (
    <Card 
      className={`overflow-hidden hover-elevate transition-all ${featured ? "border-primary/20" : ""}`}
      data-testid={`card-testimonial-${testimonial.id}`}
    >
      <CardContent className="p-6">
        <Quote className="w-8 h-8 text-primary/20 mb-4" />
        <p className="text-muted-foreground mb-4 leading-relaxed">
          "{testimonial.quote}"
        </p>
        <div className="flex items-center gap-1 mb-4">
          {renderStars(testimonial.rating)}
        </div>
        <div className="flex items-center gap-3 pt-4 border-t">
          {testimonial.avatarUrl ? (
            <img 
              src={testimonial.avatarUrl} 
              alt={testimonial.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {testimonial.name?.charAt(0) || 'M'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{testimonial.name}</p>
            {testimonial.title && (
              <p className="text-xs text-muted-foreground">{testimonial.title}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
