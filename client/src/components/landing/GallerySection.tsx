import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";

import renderExterior1 from "@assets/stock_images/architectural_render_b118ee78.jpg";
import renderExterior2 from "@assets/stock_images/architectural_render_cd4dce75.jpg";
import renderExterior3 from "@assets/stock_images/architectural_render_c7f63aa7.jpg";
import constructionCourt1 from "@assets/stock_images/sports_facility_cons_6b087ae8.jpg";
import constructionCourt2 from "@assets/stock_images/sports_facility_cons_aa71e508.jpg";
import constructionCourt3 from "@assets/stock_images/sports_facility_cons_44a23ac3.jpg";

const galleryItems = [
  { title: "Complex Exterior Render", type: "render", image: renderExterior1, category: "renders" },
  { title: "Court Construction Progress", type: "photo", image: constructionCourt1, category: "construction" },
  { title: "Sports Arena Render", type: "render", image: renderExterior2, category: "renders" },
  { title: "Indoor Facility Build", type: "photo", image: constructionCourt2, category: "construction" },
  { title: "Final Design Concept", type: "render", image: renderExterior3, category: "renders" },
  { title: "Structural Framework", type: "photo", image: constructionCourt3, category: "construction" },
];

export function GallerySection() {
  const { getValue } = useCmsMultiple([
    'gallery_title',
    'gallery_subtitle',
    'gallery_cta',
  ], CMS_DEFAULTS);

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
          <Link href="/gallery">
            <Button variant="outline" className="rounded-full" data-testid="button-view-full-gallery">
              {getValue('gallery_cta') || CMS_DEFAULTS.gallery_cta} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="qd-gallery-grid">
          {galleryItems.map((item, index) => (
            <Link key={index} href={`/gallery?category=${item.category}`}>
              <div
                className="qd-gallery-item relative overflow-hidden group cursor-pointer"
                data-testid={`gallery-item-${index}`}
              >
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
          ))}
        </div>
      </div>
    </section>
  );
}
