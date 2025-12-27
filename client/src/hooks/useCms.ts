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

// Comprehensive CMS defaults covering all sections
export const CMS_DEFAULTS: Record<string, string> = {
  // Hero Section
  hero_title: 'A bright, premium <span class="qd-hero-highlight">multi-sport arena</span> built for play, performance & community.',
  hero_subtitle: 'The Quarterdeck brings state-of-the-art Padel Tennis, Squash, an Air Rifle Range, a Multipurpose Hall, and an Open Cafe/Bar experience into a single, purpose-built complex. We are setting the new standard for indoor sports and recreation in Islamabad.',
  hero_eyebrow: 'Target Launch: December 25, 2025',
  hero_launch_date: '2025-12-25',
  hero_cta_1: 'Explore Facilities',
  hero_cta_1_url: '/facilities',
  hero_cta_2: 'View Site Updates',
  hero_cta_2_url: '/roadmap',
  hero_countdown_label: 'Estimated Launch Countdown',
  hero_status_active: 'Construction Active',
  hero_status_updates: 'Transparent progress updates',
  hero_status_booking: 'Early booking & waitlists planned',
  
  // About Section
  about_title: 'About The Quarterdeck',
  about_subtitle: 'Our core vision: Excellence in Play and Community. We are building Islamabad\'s premier destination for indoor sports, recreation, and social gathering.',
  about_cta: 'See Our Vision',
  about_cta_url: '/vision',
  about_vision_title: 'Vision & Philosophy',
  about_vision_content: 'The Quarterdeck is born from a simple idea: that sports facilities should be world-class, accessible, and designed for social connection. We prioritize bright, modern architecture, superior court surfaces, and a welcoming atmosphere. Our aim is to cultivate a vibrant community around Padel, Squash, and recreational activities.',
  about_vision_content_2: 'We are locally invested and committed to transparency throughout the construction and launch phases, ensuring the highest standards of quality and service.',
  about_tags: 'World-Class Courts,Community Focus,Transparency,All-Ages Friendly',
  about_team_title: 'The Project Team',
  about_team_content: 'The project is managed by a consortium of local real estate developers, sports enthusiasts, and seasoned facility operators. We have brought together expertise in engineering, architecture, and sports management to deliver an exceptional facility.',
  about_team_credits: 'Lead Architect: Studio 78|Structural Engineering: Eng. Solutions Pvt.|Padel Court Consultant: International Padel Federation',
  
  // Facilities Section
  facilities_title: 'Facilities at a Glance',
  facilities_subtitle: 'The complex is engineered for high-performance sports and comfortable recreation. Click "View details" for the dedicated facility pages.',
  facilities_cta: 'Check Court Availability',
  facilities_cta_url: '/booking',
  
  // Membership Section
  membership_title: 'Membership & Pricing',
  membership_subtitle: 'Choose the membership tier that fits your lifestyle. All members enjoy priority booking, exclusive discounts, and access to our world-class facilities.',
  membership_cta: 'Inquire Now',
  membership_cta_url: '/membership',
  membership_comparison_title: 'Quick Comparison',
  membership_footer: 'Questions about membership? Contact us for more details or to discuss corporate packages.',
  membership_contact_cta: 'Contact for Details',
  membership_contact_cta_url: '#contact',
  membership_terms_cta: 'View Terms & Conditions',
  membership_terms_cta_url: '/terms',
  
  // Founding Member
  founding_tier_name: 'Founding Member',
  founding_tier_label: 'Limited & Exclusive',
  founding_tier_description: 'For early supporters and investors who believe in our vision.',
  founding_tier_price: 'PKR 35,000',
  founding_tier_period: '/month',
  founding_tier_features: 'Lifetime priority booking (14-day window)|25% discount on all court bookings|10 guest passes per month|Permanent credit bonus (10%)|VIP parking & locker|Invitation to all exclusive events|Founding member recognition wall',
  
  // Gold Member
  gold_tier_name: 'Gold Membership',
  gold_tier_label: 'Premium Access',
  gold_tier_description: 'For serious athletes and frequent players who want the best experience.',
  gold_tier_price: 'PKR 15,000',
  gold_tier_period: '/month',
  gold_tier_features: '7-day advance booking window|20% discount on all court bookings|4 guest passes per month|Priority event registration|15% off coaching & clinics|Free equipment rental (2x/month)|Access to member lounge',
  
  // Silver Member
  silver_tier_name: 'Silver Membership',
  silver_tier_label: 'Standard Access',
  silver_tier_description: 'Perfect for recreational players who want regular access at great value.',
  silver_tier_price: 'PKR 5,000',
  silver_tier_period: '/month',
  silver_tier_features: '5-day advance booking window|10% discount on off-peak bookings|2 guest passes per month|10% off coaching & clinics|Member newsletter & updates|Discounted event entry',
  
  // Guest/Pay-to-Play
  guest_tier_name: 'Pay-to-Play',
  guest_tier_label: 'Non-Member Access',
  guest_tier_description: 'Try our facilities without commitment. Subject to availability.',
  guest_tier_price: 'Standard',
  guest_tier_price_suffix: ' rates',
  guest_tier_features: '2-day advance booking window|Access after member priority|Equipment rental available|Guest registration required|Can be upgraded to membership',
  
  // Contact Section
  contact_title: 'Contact & Early Interest',
  contact_subtitle: 'Connect with Our Development Team: Use the form to subscribe to our construction updates, inquire about corporate partnerships, or apply for our pre-launch membership waitlist.',
  contact_form_title: 'Early Interest Form',
  contact_form_subtitle: 'Submit your interest below and we\'ll keep you updated on our progress and launch.',
  contact_name_label: 'Your Name',
  contact_email_label: 'Your Email',
  contact_message_label: 'Your Message/Interest (e.g., Padel Coaching, Corporate Event, Career Inquiry)',
  contact_submit: 'Send Message',
  contact_email: 'info@thequarterdeck.pk',
  contact_phone: '+92 51 1234567',
  contact_address: 'Sector F-7, Islamabad, Pakistan',
  contact_socials_title: 'Socials & Location',
  contact_socials_subtitle: 'Follow our official channels for the most recent updates and progress photos:',
  contact_site_status_title: 'Site Status',
  contact_site_status: 'The complex is currently under active construction. No public access or walk-ins are permitted for safety reasons. All updates will be digital.',
  
  // Updates Section
  updates_title: 'Construction Updates',
  updates_subtitle: 'Transparent updates on progress, timeline, and achievements. Hover over each phase to see milestones.',
  updates_cta: 'View Full Roadmap',
  updates_cta_url: '/roadmap',
  
  // Gallery Section
  gallery_title: 'Gallery & Progress Photos',
  gallery_subtitle: 'Visual updates from the construction site and architectural renders of the completed facility.',
  gallery_cta: 'View Full Gallery',
  gallery_cta_url: '/gallery',
  
  // Rules Section
  rules_title: 'Rules & Safety Protocols',
  rules_subtitle: 'Ensuring a safe, respectful, and high-quality environment for all members and guests. These are our key rules.',
  rules_cta: 'View All Rules',
  rules_cta_url: '/rules',
  
  // Careers Section
  careers_title: 'Careers at The Quarterdeck',
  careers_subtitle: 'Join our team! We are looking for passionate, high-energy individuals to help us launch and run Islamabad\'s premier sports complex.',
  careers_cta: 'View Open Positions',
  careers_cta_url: '/careers',
  
  // Events Section
  events_title: 'Events & Programs',
  events_subtitle: 'Join tournaments, training academies, and social events at The Quarterdeck.',
  
  // Leaderboard Section
  leaderboard_title: 'Leaderboard',
  leaderboard_subtitle: 'Track your progress and compete with fellow members.',
  
  // Footer
  footer_tagline: 'Pakistan\'s Premier Sports & Recreation Complex',
  footer_copyright: '2024 The Quarterdeck. All rights reserved.',
  footer_quick_links_title: 'Quick Links',
  footer_facilities_title: 'Facilities',
  footer_legal_title: 'Legal',
  
  // Social Media URLs
  social_instagram: 'https://instagram.com/thequarterdeck',
  social_facebook: 'https://facebook.com/thequarterdeck',
  social_linkedin: 'https://linkedin.com/company/thequarterdeck',
  
  // Coming Soon Page
  coming_soon_title: 'Something Amazing Is Coming',
  coming_soon_subtitle: 'Opening December 2025: Padel Courts & Cafe/Bar. Construction continues through 2026 for our 3-floor building with Multipurpose Hall & Air Rifle Range.',
  coming_soon_description: 'The Quarterdeck will feature world-class Padel Tennis courts, Squash facilities, an Air Rifle Range, Multipurpose Hall, and an Open Cafe/Bar experience.',
  coming_soon_cta: 'Join the Waitlist',
  coming_soon_cta_url: '#contact',
  coming_soon_progress_label: 'Construction Progress',
  coming_soon_launch_date: '2025-12-25',
  coming_soon_location: 'Islamabad, Pakistan',
  
  // Site-wide Settings
  site_name: 'The Quarterdeck',
  site_tagline: 'Sports & Recreation Complex',
  site_launch_status: 'pre-launch',
  
  // Navbar Button Labels
  navbar_book_now: 'Book Now',
  navbar_login: 'Log In',
  navbar_signup: 'Sign Up',
  navbar_profile: 'Profile',
  navbar_logout: 'Log Out',
  navbar_admin: 'Admin',
  navbar_dashboard: 'Dashboard',
  
  // Footer Content
  footer_about_title: 'About The Quarterdeck',
  footer_about_text: 'Pakistan\'s premier indoor sports and recreation complex, featuring world-class Padel Tennis, Squash, Air Rifle Range, and more.',
  footer_newsletter_title: 'Stay Updated',
  footer_newsletter_placeholder: 'Enter your email',
  footer_newsletter_button: 'Subscribe',
  footer_address_title: 'Visit Us',
  footer_hours_title: 'Opening Hours',
  footer_hours_weekday: 'Mon-Fri: 10:00 AM - 10:00 PM',
  footer_hours_weekend: 'Sat-Sun: 9:00 AM - 11:00 PM',
  footer_privacy_link: 'Privacy Policy',
  footer_terms_link: 'Terms of Service',
  footer_refund_link: 'Refund Policy',
  
  // Booking Console Labels
  booking_title: 'Book a Court',
  booking_subtitle: 'Select your facility, date, and time slot',
  booking_select_venue: 'Select Venue',
  booking_select_facility: 'Select Facility',
  booking_select_date: 'Select Date',
  booking_select_time: 'Select Time',
  booking_select_court: 'Select Court',
  booking_duration_label: 'Duration',
  booking_addons_title: 'Add-ons',
  booking_summary_title: 'Booking Summary',
  booking_confirm_button: 'Confirm Booking',
  booking_cancel_button: 'Cancel',
  booking_payment_title: 'Payment Method',
  booking_no_slots: 'No available slots for this date',
  booking_login_required: 'Please log in to book',
  
  // Countdown Labels
  countdown_days: 'Days',
  countdown_hours: 'Hours',
  countdown_minutes: 'Minutes',
  countdown_seconds: 'Seconds',
  
  // Common Button Labels
  btn_learn_more: 'Learn More',
  btn_view_all: 'View All',
  btn_submit: 'Submit',
  btn_cancel: 'Cancel',
  btn_save: 'Save Changes',
  btn_close: 'Close',
  btn_back: 'Go Back',
  btn_next: 'Next',
  btn_previous: 'Previous',
  
  // WhatsApp Integration
  whatsapp_phone: '+923001234567',
  whatsapp_button_text: 'Chat on WhatsApp',
  whatsapp_button_visible: 'true',
  whatsapp_default_message: 'Hello, I have a question about The Quarterdeck.',
  
  // Empty States
  empty_bookings: 'You have no bookings yet.',
  empty_events: 'No events scheduled at this time.',
  empty_leaderboard: 'Leaderboard will be available after launch.',
  
  // Error Messages
  error_generic: 'Something went wrong. Please try again.',
  error_network: 'Unable to connect. Please check your internet connection.',
  error_auth_required: 'Please log in to continue.',
  error_permission_denied: 'You do not have permission to access this.',
  
  // Section Visibility Controls (homepage)
  section_about_visible: 'true',
  section_facilities_visible: 'true',
  section_updates_visible: 'true',
  section_gallery_visible: 'true',
  section_membership_visible: 'true',
  section_rules_visible: 'true',
  section_careers_visible: 'true',
};

export function parseCmsBoolean(value: string | undefined, defaultValue = true): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true';
}
