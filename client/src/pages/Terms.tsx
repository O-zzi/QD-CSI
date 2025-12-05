import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

export default function Terms() {
  const { data: cmsData, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/cms/bulk"],
  });

  const termsContent = cmsData?.find(c => c.key === "terms_conditions");
  
  let sections: PolicySection[] = [];
  try {
    if (termsContent?.content) {
      sections = JSON.parse(termsContent.content);
    }
  } catch (e) {
    console.error("Failed to parse terms content");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#2a4060] py-16">
        <div className="container mx-auto px-6 text-center text-white">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-terms-title">Terms & Conditions</h1>
          <p className="text-lg opacity-90">Last updated: December 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Terms & Conditions are being updated. Please check back soon.</p>
            </div>
          ) : (
            sections.map((section, idx) => (
              <section key={idx} className="mb-8">
                <h2 className="text-2xl font-bold text-[#2a4060] dark:text-blue-400 mb-4">{section.section}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {section.content}
                </p>
                {section.items && section.items.length > 0 && (
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
