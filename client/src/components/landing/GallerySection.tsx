import { Image } from "lucide-react";

const galleryItems = [
  { title: "Finished Render: Court View", type: "render" },
  { title: "Construction Photo: Steel Erection", type: "photo" },
  { title: "Finished Render: Cafe Area", type: "render" },
  { title: "Construction Photo: Foundation Work", type: "photo" },
  { title: "Finished Render: Exterior View", type: "render" },
  { title: "Construction Photo: Roofing", type: "photo" },
];

export function GallerySection() {
  return (
    <section id="gallery" className="qd-section">
      <div className="qd-container">
        <div className="mb-8">
          <h2 className="qd-section-title" data-testid="text-gallery-title">Gallery & Progress Photos</h2>
          <p className="text-muted-foreground max-w-2xl mt-2">
            Visual updates from the construction site and architectural renders of the completed facility.
          </p>
        </div>

        <div className="qd-gallery-grid">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className="qd-gallery-item flex flex-col items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              data-testid={`gallery-item-${index}`}
            >
              <Image className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-center px-4">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
