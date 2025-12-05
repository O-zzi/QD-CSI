import { useQuery } from "@tanstack/react-query";
import type { CmsContent, CmsField } from "@shared/schema";

interface UseCmsOptions {
  fallback?: string;
}

export function useCmsContent(key: string, options: UseCmsOptions = {}) {
  const { data, isLoading, error } = useQuery<CmsContent | null>({
    queryKey: ['/api/cms', key],
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: false,
  });

  return {
    content: data?.content || options.fallback || "",
    title: data?.title || "",
    metadata: data?.metadata,
    isLoading,
    error,
  };
}

export function useCmsMultiple(keys: string[], fallbacks: Record<string, string> = {}) {
  const { data: allContent = [], isLoading } = useQuery<CmsContent[]>({
    queryKey: ['/api/cms/bulk'],
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const contentMap: Record<string, string> = {};
  
  keys.forEach(key => {
    const found = allContent.find(c => c.key === key);
    contentMap[key] = found?.content || fallbacks[key] || "";
  });

  return {
    content: contentMap,
    isLoading,
    getValue: (key: string) => contentMap[key] || fallbacks[key] || "",
  };
}

export function useCmsFields(pageSlug: string, section?: string) {
  const { data: fields = [], isLoading } = useQuery<CmsField[]>({
    queryKey: ['/api/cms-fields', pageSlug, section],
    staleTime: 1000 * 60 * 5,
  });

  const getField = (fieldKey: string, fallback = "") => {
    const field = fields.find(f => f.fieldKey === fieldKey);
    return field?.value || fallback;
  };

  return {
    fields,
    isLoading,
    getField,
  };
}

export const CMS_DEFAULTS = {
  hero_title: 'A bright, premium <span class="qd-hero-highlight">multi-sport arena</span> built for play, performance & community.',
  hero_subtitle: 'The Quarterdeck brings state-of-the-art Padel Tennis, Squash, an Air Rifle Range, a Multipurpose Hall, Bridge Room, and an Open Café/Bar experience into a single, purpose-built complex. We are setting the new standard for indoor sports and recreation in Islamabad.',
  hero_eyebrow: 'Target Launch: Q4 2026',
  hero_launch_date: '2026-10-01',
  about_title: 'About The Quarterdeck',
  about_subtitle: 'Our core vision: Excellence in Play and Community. We are building Islamabad\'s premier destination for indoor sports, recreation, and social gathering.',
  about_vision_title: 'Vision & Philosophy',
  about_vision_content: 'The Quarterdeck is born from a simple idea: that sports facilities should be world-class, accessible, and designed for social connection. We prioritize bright, modern architecture, superior court surfaces, and a welcoming atmosphere. Our aim is to cultivate a vibrant community around Padel, Squash, and recreational activities.',
  about_vision_content_2: 'We are locally invested and committed to transparency throughout the construction and launch phases, ensuring the highest standards of quality and service.',
  about_team_title: 'The Project Team',
  about_team_content: 'The project is managed by a consortium of local real estate developers, sports enthusiasts, and seasoned facility operators. We have brought together expertise in engineering, architecture, and sports management to deliver an exceptional facility.',
  facilities_title: 'World-Class Facilities',
  facilities_subtitle: 'Experience premium courts, ranges, and social spaces designed for excellence.',
  membership_title: 'Membership Options',
  membership_subtitle: 'Join The Quarterdeck community with flexible membership plans tailored for players at every level.',
  contact_title: 'Get In Touch',
  contact_subtitle: 'Have questions about The Quarterdeck or want to learn more? Reach out to our team.',
  contact_email: 'info@thequarterdeck.pk',
  contact_phone: '+92 51 1234567',
  contact_address: 'Sector F-7, Islamabad, Pakistan',
  careers_title: 'Join Our Team',
  careers_subtitle: 'Be part of building Islamabad\'s premier sports and recreation destination.',
  events_title: 'Events & Programs',
  events_subtitle: 'Join tournaments, training academies, and social events at The Quarterdeck.',
  leaderboard_title: 'Leaderboard',
  leaderboard_subtitle: 'Track your progress and compete with fellow members.',
  rules_title: 'Club Rules & Etiquette',
  rules_subtitle: 'Guidelines for ensuring a premium experience for all members and guests.',
};
