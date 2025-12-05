import renderCourtView from "@assets/stock_images/modern_sports_comple_db8b6ad3.jpg";
import constructionSteel from "@assets/stock_images/sports_facility_cons_dbe0ca16.jpg";
import renderCafe from "@assets/stock_images/modern_cafe_interior_c554b982.jpg";
import constructionFoundation from "@assets/stock_images/construction_site_fo_987f2281.jpg";
import renderExterior from "@assets/stock_images/modern_sports_comple_97c8483a.jpg";
import constructionRoofing from "@assets/stock_images/sports_facility_cons_42f46556.jpg";

const galleryItems = [
  { title: "Finished Render: Court View", type: "render", image: renderCourtView },
  { title: "Construction Photo: Steel Erection", type: "photo", image: constructionSteel },
  { title: "Finished Render: Cafe Area", type: "render", image: renderCafe },
  { title: "Construction Photo: Foundation Work", type: "photo", image: constructionFoundation },
  { title: "Finished Render: Exterior View", type: "render", image: renderExterior },
  { title: "Construction Photo: Roofing", type: "photo", image: constructionRoofing },
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
          ))}
        </div>
      </div>
    </section>
  );
}
