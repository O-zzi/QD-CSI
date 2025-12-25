import { useState, useMemo } from "react";
import { useSearch } from "wouter";
import { Filter, ImageOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryImage } from "@shared/schema";

const categories = [
  { id: "all", label: "All Photos" },
  { id: "Renders", label: "Architectural Renders" },
  { id: "Construction", label: "Construction Progress" },
  { id: "Facilities", label: "Facilities" },
];

export default function Gallery() {
  const searchParams = useSearch();
  const urlCategory = new URLSearchParams(searchParams).get("category");
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || "all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const { data: galleryImages, isLoading, error } = useQuery<GalleryImage[]>({
    queryKey: ['/api/gallery'],
  });

  const filteredItems = useMemo(() => {
    if (!galleryImages) return [];
    const activeImages = galleryImages.filter(img => img.isActive !== false);
    if (selectedCategory === "all") return activeImages;
    return activeImages.filter((item) => 
      item.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory, galleryImages]);

  const availableCategories = useMemo(() => {
    if (!galleryImages) return categories;
    const usedCategories = new Set(
      galleryImages
        .filter(img => img.isActive !== false)
        .map(img => img.category?.toLowerCase())
        .filter(Boolean)
    );
    return categories.filter(cat => 
      cat.id === "all" || usedCategories.has(cat.id.toLowerCase())
    );
  }, [galleryImages]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title="Gallery & Progress"
          subtitle="Explore architectural renders, construction updates, and facility photos from The Quarterdeck sports complex."
          testId="text-gallery-page-title"
        />

        <div className="qd-container py-8">
          <PageBreadcrumb />
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ImageOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Unable to load gallery images.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-8" data-testid="gallery-filters">
                <Filter className="w-5 h-5 text-muted-foreground mr-2 self-center" />
                {availableCategories.map((cat) => (
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
                      src={item.imageUrl}
                      alt={item.title || "Gallery image"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-sm text-white font-medium">{item.title || "Untitled"}</span>
                      {item.category && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/80 text-white uppercase tracking-wide">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <ImageOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No images found in this category.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="gallery-lightbox"
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.title || "Gallery image"}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <h3 className="text-white text-xl font-semibold">{selectedImage.title || "Untitled"}</h3>
              {selectedImage.description && (
                <p className="text-white/80 mt-2">{selectedImage.description}</p>
              )}
            </div>
            <button
              className="absolute top-4 right-4 text-white hover:text-white/80 text-3xl font-light"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              data-testid="close-lightbox"
            >
              x
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
