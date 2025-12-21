import { Loader2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface PolicySection {
  section: string;
  content: string;
  items: string[];
}

interface CmsContent {
  id: string;
  key: string;
  title: string;
  content: string;
  isActive: boolean;
}

export default function Privacy() {
  const { data: cmsData, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/cms/bulk"],
  });

  const privacyContent = cmsData?.find(c => c.key === "privacy_policy");
  
  let sections: PolicySection[] = [];
  try {
    if (privacyContent?.content) {
      sections = JSON.parse(privacyContent.content);
    }
  } catch (e) {
    console.error("Failed to parse privacy policy content");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="relative h-[30vh] min-h-[200px] bg-[#2a4060] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-privacy-title">Privacy Policy</h1>
            <p className="text-lg opacity-90">Last updated: December 2025</p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Privacy policy is being updated. Please check back soon.</p>
              </div>
            ) : (
              sections.map((section, idx) => (
                <section key={idx} className="mb-8">
                  <h2 className="text-2xl font-bold text-[#2a4060] dark:text-sky-400 mb-4">{section.section}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {section.content}
                  </p>
                  {section.items && section.items.length > 0 && (
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      {section.items.map((item, itemIdx) => {
                        const colonIndex = item.indexOf(':');
                        if (colonIndex > -1 && colonIndex < 30) {
                          const label = item.slice(0, colonIndex);
                          const description = item.slice(colonIndex + 1);
                          return (
                            <li key={itemIdx}>
                              <strong>{label}:</strong>{description}
                            </li>
                          );
                        }
                        return <li key={itemIdx}>{item}</li>;
                      })}
                    </ul>
                  )}
                </section>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
