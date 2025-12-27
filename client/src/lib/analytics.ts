// Google Analytics integration
// See: blueprint:javascript_google_analytics

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track specific user actions
export const trackUserAction = {
  login: () => trackEvent('login', 'auth', 'user_login'),
  signup: () => trackEvent('sign_up', 'auth', 'user_signup'),
  logout: () => trackEvent('logout', 'auth', 'user_logout'),
  
  booking: (facilitySlug: string) => trackEvent('booking_created', 'booking', facilitySlug),
  bookingCancelled: (facilitySlug: string) => trackEvent('booking_cancelled', 'booking', facilitySlug),
  
  eventRegistration: (eventId: string) => trackEvent('event_registration', 'events', eventId),
  
  membershipInquiry: (tier: string) => trackEvent('membership_inquiry', 'membership', tier),
  
  contactFormSubmit: () => trackEvent('contact_form_submit', 'engagement', 'contact'),
  careerApplication: (jobTitle: string) => trackEvent('career_application', 'careers', jobTitle),
  
  facilityView: (facilitySlug: string) => trackEvent('facility_view', 'facilities', facilitySlug),
  galleryView: () => trackEvent('gallery_view', 'engagement', 'gallery'),
};
