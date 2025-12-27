import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import type { SiteImage } from "@shared/schema";

import renderExterior1Default from "@assets/stock_images/architectural_render_b118ee78.jpg";
import renderExterior2Default from "@assets/stock_images/architectural_render_cd4dce75.jpg";
import renderExterior3Default from "@assets/stock_images/architectural_render_c7f63aa7.jpg";
import constructionCourt1Default from "@assets/stock_images/sports_facility_cons_6b087ae8.jpg";
import constructionCourt2Default from "@assets/stock_images/sports_facility_cons_aa71e508.jpg";
import constructionCourt3Default from "@assets/stock_images/sports_facility_cons_44a23ac3.jpg";

const defaultGalleryItems = [
  { key: "gallery-1", title: "Complex Exterior Render", type: "render", image: renderExterior1Default, category: "renders" },
  { key: "gallery-2", title: "Court Construction Progress", type: "photo", image: constructionCourt1Default, category: "construction" },
  { key: "gallery-3", title: "Sports Arena Render", type: "render", image: renderExterior2Default, category: "renders" },
  { key: "gallery-4", title: "Indoor Facility Build", type: "photo", image: constructionCourt2Default, category: "construction" },
  { key: "gallery-5", title: "Final Design Concept", type: "render", image: renderExterior3Default, category: "renders" },
  { key: "gallery-6", title: "Structural Framework", type: "photo", image: constructionCourt3Default, category: "construction" },
];

export function GallerySection() {
  const { getValue } = useCmsMultiple([
    'gallery_title',
    'gallery_subtitle',
    'gallery_cta',
    'gallery_cta_url',
  ], CMS_DEFAULTS);

  const { data: siteImages = [] } = useQuery<SiteImage[]>({
    queryKey: ['/api/site-images', 'gallery'],
    queryFn: async () => {
      const res = await fetch('/api/site-images?page=gallery');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const galleryItems = useMemo(() => {
    return defaultGalleryItems.map((item, index) => {
      const cmsImage = siteImages.find(
        img => img.section === item.key && img.isActive
      );
      return {
        ...item,
        title: cmsImage?.title || item.title,
        image: cmsImage?.imageUrl || item.image,
      };
    });
  }, [siteImages]);

  return (
    <section id="gallery" className="qd-section">
      <div className="qd-container">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <h2 className="qd-section-title" data-testid="text-gallery-title">
              {getValue('gallery_title') || CMS_DEFAULTS.gallery_title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mt-2">
              {getValue('gallery_subtitle') || CMS_DEFAULTS.gallery_subtitle}
            </p>
          </div>
          <Link href={getValue('gallery_cta_url') || CMS_DEFAULTS.gallery_cta_url || '/gallery'}>
            <Button variant="outline" className="rounded-full" data-testid="button-view-full-gallery">
              {getValue('gallery_cta') || CMS_DEFAULTS.gallery_cta} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3500,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {galleryItems.map((item, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <Link href={`/gallery?category=${item.category}`}>
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
                    data-testid={`gallery-item-${index}`}
                  >
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-sm text-white font-medium">{item.title}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${item.type === "render" ? "bg-blue-500/80" : "bg-amber-500/80"} text-white uppercase tracking-wide`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
