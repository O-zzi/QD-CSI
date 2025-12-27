import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonicalUrl?: string;
}

const SITE_NAME = "The Quarterdeck";
const DEFAULT_DESCRIPTION = "Premium sports and recreation complex in Islamabad, Pakistan featuring Padel Tennis, Squash, Air Rifle Range, and more. Book your facilities, join events, and become a member today.";

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  canonicalUrl,
}: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      
      if (!meta) {
        meta = document.createElement("meta");
        if (isProperty) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateMeta("description", description);

    updateMeta("og:title", ogTitle || fullTitle, true);
    updateMeta("og:description", ogDescription || description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:site_name", SITE_NAME, true);
    
    if (ogImage) {
      updateMeta("og:image", ogImage, true);
    }
    
    if (canonicalUrl) {
      updateMeta("og:url", canonicalUrl, true);
      
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }

    updateMeta("twitter:card", twitterCard);
    updateMeta("twitter:title", ogTitle || fullTitle);
    updateMeta("twitter:description", ogDescription || description);
    if (ogImage) {
      updateMeta("twitter:image", ogImage);
    }

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, ogTitle, ogDescription, ogImage, ogType, twitterCard, canonicalUrl]);
}
