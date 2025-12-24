import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import renderExterior1 from "@assets/stock_images/architectural_render_b118ee78.jpg";
import renderExterior2 from "@assets/stock_images/architectural_render_cd4dce75.jpg";
import renderExterior3 from "@assets/stock_images/architectural_render_c7f63aa7.jpg";
import constructionCourt1 from "@assets/stock_images/sports_facility_cons_6b087ae8.jpg";
import constructionCourt2 from "@assets/stock_images/sports_facility_cons_aa71e508.jpg";
import constructionCourt3 from "@assets/stock_images/sports_facility_cons_44a23ac3.jpg";
import padelCourt1 from "@assets/stock_images/padel_tennis_court_i_a0e484ae.jpg";
import padelCourt2 from "@assets/stock_images/padel_tennis_court_i_d29f9aaf.jpg";
import padelCourt3 from "@assets/stock_images/padel_tennis_court_i_37ae0ba3.jpg";
import squashCourt1 from "@assets/stock_images/indoor_squash_court__c97e350b.jpg";
import squashCourt2 from "@assets/stock_images/indoor_squash_court__3447d74a.jpg";
import shootingRange1 from "@assets/stock_images/shooting_range_indoo_08edce49.jpg";
import shootingRange2 from "@assets/stock_images/shooting_range_indoo_e2b54b1a.jpg";
import eventHall1 from "@assets/stock_images/large_event_hall_int_39cfb773.jpg";
import eventHall2 from "@assets/stock_images/large_event_hall_int_32ffc7ae.jpg";

const allGalleryItems = [
  { id: 1, title: "Complex Exterior Render", type: "render" as const, category: "renders", image: renderExterior1 },
  { id: 2, title: "Sports Arena Render", type: "render" as const, category: "renders", image: renderExterior2 },
  { id: 3, title: "Final Design Concept", type: "render" as const, category: "renders", image: renderExterior3 },
  { id: 4, title: "Court Construction Progress", type: "photo" as const, category: "construction", image: constructionCourt1 },
  { id: 5, title: "Indoor Facility Build", type: "photo" as const, category: "construction", image: constructionCourt2 },
  { id: 6, title: "Structural Framework", type: "photo" as const, category: "construction", image: constructionCourt3 },
  { id: 7, title: "Padel Court Overview", type: "photo" as const, category: "facilities", image: padelCourt1 },
  { id: 8, title: "Padel Courts Interior", type: "photo" as const, category: "facilities", image: padelCourt2 },
  { id: 9, title: "Padel Match in Progress", type: "photo" as const, category: "facilities", image: padelCourt3 },
  { id: 10, title: "Squash Court View", type: "photo" as const, category: "facilities", image: squashCourt1 },
  { id: 11, title: "Squash Court Interior", type: "photo" as const, category: "facilities", image: squashCourt2 },
  { id: 12, title: "Air Rifle Range", type: "photo" as const, category: "facilities", image: shootingRange1 },
  { id: 13, title: "Target Practice Lane", type: "photo" as const, category: "facilities", image: shootingRange2 },
  { id: 14, title: "Multipurpose Hall", type: "photo" as const, category: "facilities", image: eventHall1 },
  { id: 15, title: "Event Hall Setup", type: "photo" as const, category: "facilities", image: eventHall2 },
];

const categories = [
  { id: "all", label: "All Photos" },
  { id: "renders", label: "Architectural Renders" },
  { id: "construction", label: "Construction Progress" },
  { id: "facilities", label: "Facilities" },
];

export default function Gallery() {
  const searchParams = useSearch();
  const urlCategory = new URLSearchParams(searchParams).get("category");
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || "all");
  const [selectedImage, setSelectedImage] = useState<typeof allGalleryItems[0] | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") return allGalleryItems;
    return allGalleryItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-6 pb-16">
        <div className="qd-container">
          <div className="mb-8">
            <Link href="/#gallery">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-home">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold mb-2" data-testid="text-gallery-page-title">Gallery & Progress Photos</h1>
            <p className="text-muted-foreground max-w-2xl">
              Explore architectural renders, construction updates, and facility photos from The Quarterdeck sports complex.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8" data-testid="gallery-filters">
            <Filter className="w-5 h-5 text-muted-foreground mr-2 self-center" />
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`filter-${cat.id}`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => setSelectedImage(item)}
                data-testid={`gallery-image-${item.id}`}
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
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images found in this category.</p>
            </div>
          )}
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="lightbox-overlay"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedImage.image}
              alt={selectedImage.title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
              <span className="text-lg text-white font-medium">{selectedImage.title}</span>
              <span className={`ml-3 text-xs px-2 py-1 rounded-full ${selectedImage.type === "render" ? "bg-blue-500/80" : "bg-amber-500/80"} text-white uppercase tracking-wide`}>
                {selectedImage.type}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              data-testid="button-close-lightbox"
            >
              <span className="text-2xl">&times;</span>
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
