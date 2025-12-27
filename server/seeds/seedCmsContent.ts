import { db } from "../db";
import { cmsContent } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface CmsSeedResult {
  created: number;
  updated: number;
  skipped: number;
}

const CMS_SEEDS: Array<{ key: string; content: string; title?: string }> = [
  // Hero Section
  { key: "hero_title", content: 'A bright, premium <span class="qd-hero-highlight">multi-sport arena</span> built for play, performance & community.', title: "Hero Title" },
  { key: "hero_subtitle", content: "The Quarterdeck brings state-of-the-art Padel Tennis, Squash, an Air Rifle Range, a Multipurpose Hall, and an Open Cafe/Bar experience into a single, purpose-built complex. We are setting the new standard for indoor sports and recreation in Islamabad.", title: "Hero Subtitle" },
  { key: "hero_eyebrow", content: "Target Launch: December 25, 2025", title: "Hero Eyebrow" },
  { key: "hero_launch_date", content: "2025-12-25", title: "Hero Launch Date" },
  { key: "hero_cta_1", content: "Explore Facilities", title: "Hero CTA 1" },
  { key: "hero_cta_1_url", content: "/facilities", title: "Hero CTA 1 URL" },
  { key: "hero_cta_2", content: "View Site Updates", title: "Hero CTA 2" },
  { key: "hero_cta_2_url", content: "/roadmap", title: "Hero CTA 2 URL" },
  { key: "hero_countdown_label", content: "Estimated Launch Countdown", title: "Hero Countdown Label" },
  { key: "hero_status_active", content: "Construction Active", title: "Hero Status Active" },
  { key: "hero_status_updates", content: "Transparent progress updates", title: "Hero Status Updates" },
  { key: "hero_status_booking", content: "Early booking & waitlists planned", title: "Hero Status Booking" },

  // About Section
  { key: "about_title", content: "About The Quarterdeck", title: "About Title" },
  { key: "about_subtitle", content: "Our core vision: Excellence in Play and Community. We are building Islamabad's premier destination for indoor sports, recreation, and social gathering.", title: "About Subtitle" },
  { key: "about_cta", content: "See Our Vision", title: "About CTA" },
  { key: "about_cta_url", content: "/vision", title: "About CTA URL" },
  { key: "about_vision_title", content: "Vision & Philosophy", title: "About Vision Title" },
  { key: "about_vision_content", content: "The Quarterdeck is born from a simple idea: that sports facilities should be world-class, accessible, and designed for social connection. We prioritize bright, modern architecture, superior court surfaces, and a welcoming atmosphere. Our aim is to cultivate a vibrant community around Padel, Squash, and recreational activities.", title: "About Vision Content" },
  { key: "about_vision_content_2", content: "We are locally invested and committed to transparency throughout the construction and launch phases, ensuring the highest standards of quality and service.", title: "About Vision Content 2" },
  { key: "about_tags", content: "World-Class Courts,Community Focus,Transparency,All-Ages Friendly", title: "About Tags" },
  { key: "about_team_title", content: "The Project Team", title: "About Team Title" },
  { key: "about_team_content", content: "The project is managed by a consortium of local real estate developers, sports enthusiasts, and seasoned facility operators. We have brought together expertise in engineering, architecture, and sports management to deliver an exceptional facility.", title: "About Team Content" },
  { key: "about_team_credits", content: "Lead Architect: Studio 78|Structural Engineering: Eng. Solutions Pvt.|Padel Court Consultant: International Padel Federation", title: "About Team Credits" },

  // Facilities Section
  { key: "facilities_title", content: "Facilities at a Glance", title: "Facilities Title" },
  { key: "facilities_subtitle", content: 'The complex is engineered for high-performance sports and comfortable recreation. Click "View details" for the dedicated facility pages.', title: "Facilities Subtitle" },
  { key: "facilities_cta", content: "Check Court Availability", title: "Facilities CTA" },
  { key: "facilities_cta_url", content: "/booking", title: "Facilities CTA URL" },

  // Membership Section
  { key: "membership_title", content: "Membership & Pricing", title: "Membership Title" },
  { key: "membership_subtitle", content: "Choose the membership tier that fits your lifestyle. All members enjoy priority booking, exclusive discounts, and access to our world-class facilities.", title: "Membership Subtitle" },
  { key: "membership_cta", content: "Inquire Now", title: "Membership CTA" },
  { key: "membership_cta_url", content: "/membership", title: "Membership CTA URL" },
  { key: "membership_comparison_title", content: "Quick Comparison", title: "Membership Comparison Title" },
  { key: "membership_footer", content: "Questions about membership? Contact us for more details or to discuss corporate packages.", title: "Membership Footer" },
  { key: "membership_contact_cta", content: "Contact for Details", title: "Membership Contact CTA" },
  { key: "membership_contact_cta_url", content: "#contact", title: "Membership Contact CTA URL" },
  { key: "membership_terms_cta", content: "View Terms & Conditions", title: "Membership Terms CTA" },
  { key: "membership_terms_cta_url", content: "/terms", title: "Membership Terms CTA URL" },

  // Founding Member Tier
  { key: "founding_tier_name", content: "Founding Member", title: "Founding Tier Name" },
  { key: "founding_tier_label", content: "Limited & Exclusive", title: "Founding Tier Label" },
  { key: "founding_tier_description", content: "For early supporters and investors who believe in our vision.", title: "Founding Tier Description" },
  { key: "founding_tier_price", content: "PKR 35,000", title: "Founding Tier Price" },
  { key: "founding_tier_period", content: "/month", title: "Founding Tier Period" },
  { key: "founding_tier_features", content: "Lifetime priority booking (14-day window)|25% discount on all court bookings|10 guest passes per month|Permanent credit bonus (10%)|VIP parking & locker|Invitation to all exclusive events|Founding member recognition wall", title: "Founding Tier Features" },

  // Gold Member Tier
  { key: "gold_tier_name", content: "Gold Membership", title: "Gold Tier Name" },
  { key: "gold_tier_label", content: "Premium Access", title: "Gold Tier Label" },
  { key: "gold_tier_description", content: "For serious athletes and frequent players who want the best experience.", title: "Gold Tier Description" },
  { key: "gold_tier_price", content: "PKR 15,000", title: "Gold Tier Price" },
  { key: "gold_tier_period", content: "/month", title: "Gold Tier Period" },
  { key: "gold_tier_features", content: "7-day advance booking window|20% discount on all court bookings|4 guest passes per month|Priority event registration|15% off coaching & clinics|Free equipment rental (2x/month)|Access to member lounge", title: "Gold Tier Features" },

  // Silver Member Tier
  { key: "silver_tier_name", content: "Silver Membership", title: "Silver Tier Name" },
  { key: "silver_tier_label", content: "Standard Access", title: "Silver Tier Label" },
  { key: "silver_tier_description", content: "Perfect for recreational players who want regular access at great value.", title: "Silver Tier Description" },
  { key: "silver_tier_price", content: "PKR 5,000", title: "Silver Tier Price" },
  { key: "silver_tier_period", content: "/month", title: "Silver Tier Period" },
  { key: "silver_tier_features", content: "5-day advance booking window|10% discount on off-peak bookings|2 guest passes per month|10% off coaching & clinics|Member newsletter & updates|Discounted event entry", title: "Silver Tier Features" },

  // Guest/Pay-to-Play Tier
  { key: "guest_tier_name", content: "Pay-to-Play", title: "Guest Tier Name" },
  { key: "guest_tier_label", content: "Non-Member Access", title: "Guest Tier Label" },
  { key: "guest_tier_description", content: "Try our facilities without commitment. Subject to availability.", title: "Guest Tier Description" },
  { key: "guest_tier_price", content: "Standard", title: "Guest Tier Price" },
  { key: "guest_tier_price_suffix", content: " rates", title: "Guest Tier Price Suffix" },
  { key: "guest_tier_features", content: "2-day advance booking window|Access after member priority|Equipment rental available|Guest registration required|Can be upgraded to membership", title: "Guest Tier Features" },

  // Contact Section
  { key: "contact_title", content: "Contact & Early Interest", title: "Contact Title" },
  { key: "contact_subtitle", content: "Connect with Our Development Team: Use the form to subscribe to our construction updates, inquire about corporate partnerships, or apply for our pre-launch membership waitlist.", title: "Contact Subtitle" },
  { key: "contact_form_title", content: "Early Interest Form", title: "Contact Form Title" },
  { key: "contact_form_subtitle", content: "Submit your interest below and we'll keep you updated on our progress and launch.", title: "Contact Form Subtitle" },
  { key: "contact_name_label", content: "Your Name", title: "Contact Name Label" },
  { key: "contact_email_label", content: "Your Email", title: "Contact Email Label" },
  { key: "contact_message_label", content: "Your Message/Interest (e.g., Padel Coaching, Corporate Event, Career Inquiry)", title: "Contact Message Label" },
  { key: "contact_submit", content: "Send Message", title: "Contact Submit" },
  { key: "contact_email", content: "info@thequarterdeck.pk", title: "Contact Email" },
  { key: "contact_phone", content: "+92 51 1234567", title: "Contact Phone" },
  { key: "contact_address", content: "Sector F-7, Islamabad, Pakistan", title: "Contact Address" },
  { key: "contact_socials_title", content: "Socials & Location", title: "Contact Socials Title" },
  { key: "contact_socials_subtitle", content: "Follow our official channels for the most recent updates and progress photos:", title: "Contact Socials Subtitle" },
  { key: "contact_site_status_title", content: "Site Status", title: "Contact Site Status Title" },
  { key: "contact_site_status", content: "The complex is currently under active construction. No public access or walk-ins are permitted for safety reasons. All updates will be digital.", title: "Contact Site Status" },

  // Updates Section
  { key: "updates_title", content: "Construction Updates", title: "Updates Title" },
  { key: "updates_subtitle", content: "Transparent updates on progress, timeline, and achievements. Hover over each phase to see milestones.", title: "Updates Subtitle" },
  { key: "updates_cta", content: "View Full Roadmap", title: "Updates CTA" },
  { key: "updates_cta_url", content: "/roadmap", title: "Updates CTA URL" },

  // Gallery Section
  { key: "gallery_title", content: "Gallery & Progress Photos", title: "Gallery Title" },
  { key: "gallery_subtitle", content: "Visual updates from the construction site and architectural renders of the completed facility.", title: "Gallery Subtitle" },
  { key: "gallery_cta", content: "View Full Gallery", title: "Gallery CTA" },
  { key: "gallery_cta_url", content: "/gallery", title: "Gallery CTA URL" },

  // Rules Section
  { key: "rules_title", content: "Rules & Safety Protocols", title: "Rules Title" },
  { key: "rules_subtitle", content: "Ensuring a safe, respectful, and high-quality environment for all members and guests. These are our key rules.", title: "Rules Subtitle" },
  { key: "rules_cta", content: "View All Rules", title: "Rules CTA" },
  { key: "rules_cta_url", content: "/rules", title: "Rules CTA URL" },

  // Careers Section
  { key: "careers_title", content: "Careers at The Quarterdeck", title: "Careers Title" },
  { key: "careers_subtitle", content: "Join our team! We are looking for passionate, high-energy individuals to help us launch and run Islamabad's premier sports complex.", title: "Careers Subtitle" },
  { key: "careers_cta", content: "View Open Positions", title: "Careers CTA" },
  { key: "careers_cta_url", content: "/careers", title: "Careers CTA URL" },

  // Events Section
  { key: "events_title", content: "Events & Programs", title: "Events Title" },
  { key: "events_subtitle", content: "Join tournaments, training academies, and social events at The Quarterdeck.", title: "Events Subtitle" },

  // Leaderboard Section
  { key: "leaderboard_title", content: "Leaderboard", title: "Leaderboard Title" },
  { key: "leaderboard_subtitle", content: "Track your progress and compete with fellow members.", title: "Leaderboard Subtitle" },

  // Footer
  { key: "footer_tagline", content: "Pakistan's Premier Sports & Recreation Complex", title: "Footer Tagline" },
  { key: "footer_copyright", content: "2024 The Quarterdeck. All rights reserved.", title: "Footer Copyright" },
  { key: "footer_quick_links_title", content: "Quick Links", title: "Footer Quick Links Title" },
  { key: "footer_facilities_title", content: "Facilities", title: "Footer Facilities Title" },
  { key: "footer_legal_title", content: "Legal", title: "Footer Legal Title" },
  { key: "footer_about_title", content: "About The Quarterdeck", title: "Footer About Title" },
  { key: "footer_about_text", content: "Pakistan's premier indoor sports and recreation complex, featuring world-class Padel Tennis, Squash, Air Rifle Range, and more.", title: "Footer About Text" },
  { key: "footer_newsletter_title", content: "Stay Updated", title: "Footer Newsletter Title" },
  { key: "footer_newsletter_placeholder", content: "Enter your email", title: "Footer Newsletter Placeholder" },
  { key: "footer_newsletter_button", content: "Subscribe", title: "Footer Newsletter Button" },
  { key: "footer_address_title", content: "Visit Us", title: "Footer Address Title" },
  { key: "footer_hours_title", content: "Opening Hours", title: "Footer Hours Title" },
  { key: "footer_hours_weekday", content: "Mon-Fri: 10:00 AM - 10:00 PM", title: "Footer Hours Weekday" },
  { key: "footer_hours_weekend", content: "Sat-Sun: 9:00 AM - 11:00 PM", title: "Footer Hours Weekend" },
  { key: "footer_privacy_link", content: "Privacy Policy", title: "Footer Privacy Link" },
  { key: "footer_terms_link", content: "Terms of Service", title: "Footer Terms Link" },
  { key: "footer_refund_link", content: "Refund Policy", title: "Footer Refund Link" },

  // Social Media URLs
  { key: "social_instagram", content: "https://instagram.com/thequarterdeck", title: "Social Instagram" },
  { key: "social_facebook", content: "https://facebook.com/thequarterdeck", title: "Social Facebook" },
  { key: "social_linkedin", content: "https://linkedin.com/company/thequarterdeck", title: "Social LinkedIn" },

  // Coming Soon Page
  { key: "coming_soon_title", content: "Something Amazing Is Coming", title: "Coming Soon Title" },
  { key: "coming_soon_subtitle", content: "Opening December 2025: Padel Courts & Cafe/Bar. Construction continues through 2026 for our 3-floor building with Multipurpose Hall & Air Rifle Range.", title: "Coming Soon Subtitle" },
  { key: "coming_soon_description", content: "The Quarterdeck will feature world-class Padel Tennis courts, Squash facilities, an Air Rifle Range, Multipurpose Hall, and an Open Cafe/Bar experience.", title: "Coming Soon Description" },
  { key: "coming_soon_cta", content: "Join the Waitlist", title: "Coming Soon CTA" },
  { key: "coming_soon_cta_url", content: "#contact", title: "Coming Soon CTA URL" },
  { key: "coming_soon_progress_label", content: "Construction Progress", title: "Coming Soon Progress Label" },
  { key: "coming_soon_launch_date", content: "2025-12-25", title: "Coming Soon Launch Date" },
  { key: "coming_soon_location", content: "Islamabad, Pakistan", title: "Coming Soon Location" },

  // Site-wide Settings
  { key: "site_name", content: "The Quarterdeck", title: "Site Name" },
  { key: "site_tagline", content: "Sports & Recreation Complex", title: "Site Tagline" },
  { key: "site_launch_status", content: "pre-launch", title: "Site Launch Status" },

  // Navbar Button Labels
  { key: "navbar_book_now", content: "Book Now", title: "Navbar Book Now" },
  { key: "navbar_login", content: "Log In", title: "Navbar Login" },
  { key: "navbar_signup", content: "Sign Up", title: "Navbar Signup" },
  { key: "navbar_profile", content: "Profile", title: "Navbar Profile" },
  { key: "navbar_logout", content: "Log Out", title: "Navbar Logout" },
  { key: "navbar_admin", content: "Admin", title: "Navbar Admin" },
  { key: "navbar_dashboard", content: "Dashboard", title: "Navbar Dashboard" },

  // Booking Console Labels
  { key: "booking_title", content: "Book a Court", title: "Booking Title" },
  { key: "booking_subtitle", content: "Select your facility, date, and time slot", title: "Booking Subtitle" },
  { key: "booking_select_venue", content: "Select Venue", title: "Booking Select Venue" },
  { key: "booking_select_facility", content: "Select Facility", title: "Booking Select Facility" },
  { key: "booking_select_date", content: "Select Date", title: "Booking Select Date" },
  { key: "booking_select_time", content: "Select Time", title: "Booking Select Time" },
  { key: "booking_select_court", content: "Select Court", title: "Booking Select Court" },
  { key: "booking_duration_label", content: "Duration", title: "Booking Duration Label" },
  { key: "booking_addons_title", content: "Add-ons", title: "Booking Addons Title" },
  { key: "booking_summary_title", content: "Booking Summary", title: "Booking Summary Title" },
  { key: "booking_confirm_button", content: "Confirm Booking", title: "Booking Confirm Button" },
  { key: "booking_cancel_button", content: "Cancel", title: "Booking Cancel Button" },
  { key: "booking_payment_title", content: "Payment Method", title: "Booking Payment Title" },
  { key: "booking_no_slots", content: "No available slots for this date", title: "Booking No Slots" },
  { key: "booking_login_required", content: "Please log in to book", title: "Booking Login Required" },

  // Countdown Labels
  { key: "countdown_days", content: "Days", title: "Countdown Days" },
  { key: "countdown_hours", content: "Hours", title: "Countdown Hours" },
  { key: "countdown_minutes", content: "Minutes", title: "Countdown Minutes" },
  { key: "countdown_seconds", content: "Seconds", title: "Countdown Seconds" },

  // Common Button Labels
  { key: "btn_learn_more", content: "Learn More", title: "Button Learn More" },
  { key: "btn_view_all", content: "View All", title: "Button View All" },
  { key: "btn_submit", content: "Submit", title: "Button Submit" },
  { key: "btn_cancel", content: "Cancel", title: "Button Cancel" },
  { key: "btn_save", content: "Save Changes", title: "Button Save" },
  { key: "btn_close", content: "Close", title: "Button Close" },
  { key: "btn_back", content: "Go Back", title: "Button Back" },
  { key: "btn_next", content: "Next", title: "Button Next" },
  { key: "btn_previous", content: "Previous", title: "Button Previous" },

  // WhatsApp Integration
  { key: "whatsapp_phone", content: "+923001234567", title: "WhatsApp Phone" },
  { key: "whatsapp_button_text", content: "Chat on WhatsApp", title: "WhatsApp Button Text" },
  { key: "whatsapp_button_visible", content: "true", title: "WhatsApp Button Visible" },
  { key: "whatsapp_default_message", content: "Hello, I have a question about The Quarterdeck.", title: "WhatsApp Default Message" },

  // Empty States
  { key: "empty_bookings", content: "You have no bookings yet.", title: "Empty Bookings" },
  { key: "empty_events", content: "No events scheduled at this time.", title: "Empty Events" },
  { key: "empty_leaderboard", content: "Leaderboard will be available after launch.", title: "Empty Leaderboard" },

  // Page-specific Hero Content
  { key: "page_facilities_title", content: "Our Facilities", title: "Facilities Page Title" },
  { key: "page_facilities_subtitle", content: "World-class sports and recreation facilities designed for excellence in Islamabad", title: "Facilities Page Subtitle" },
  { key: "page_facilities_ready_title", content: "Ready to Book?", title: "Facilities Ready Title" },
  { key: "page_facilities_ready_description", content: "Members can book facilities through our online booking system. Log in to access all our premium facilities and exclusive member benefits.", title: "Facilities Ready Description" },
  { key: "page_facilities_book_cta", content: "Book Now", title: "Facilities Book CTA" },
  { key: "page_facilities_contact_cta", content: "Contact Us", title: "Facilities Contact CTA" },

  { key: "page_membership_title", content: "Membership", title: "Membership Page Title" },
  { key: "page_membership_subtitle", content: "Join The Quarterdeck community and unlock exclusive benefits, priority booking, and member-only perks.", title: "Membership Page Subtitle" },
  { key: "page_membership_why_title", content: "Why Become a Member?", title: "Membership Why Title" },
  { key: "page_membership_why_description", content: "Enjoy exclusive access to world-class facilities, priority booking, and a vibrant community of sports enthusiasts.", title: "Membership Why Description" },
  { key: "page_membership_tiers_title", content: "Membership Tiers", title: "Membership Tiers Title" },
  { key: "page_membership_tiers_description", content: "Choose the membership tier that best fits your lifestyle and sports goals.", title: "Membership Tiers Description" },
  { key: "page_membership_ready_title", content: "Ready to Join?", title: "Membership Ready Title" },
  { key: "page_membership_ready_description", content: "Create your account and choose your membership tier to start enjoying exclusive benefits today.", title: "Membership Ready Description" },
  { key: "page_membership_create_cta", content: "Create Account", title: "Membership Create CTA" },
  { key: "page_membership_contact_cta", content: "Contact Us", title: "Membership Contact CTA" },

  { key: "page_contact_title", content: "Contact Us", title: "Contact Page Title" },
  { key: "page_contact_subtitle", content: "Get in touch with The Quarterdeck team. We're here to help with bookings, memberships, and any questions you may have.", title: "Contact Page Subtitle" },
  { key: "page_contact_form_title", content: "Send Us a Message", title: "Contact Form Title" },
  { key: "page_contact_success_title", content: "Thank You!", title: "Contact Success Title" },
  { key: "page_contact_success_message", content: "Your message has been sent successfully. We'll respond within 24-48 hours.", title: "Contact Success Message" },
  { key: "page_contact_info_title", content: "Contact Information", title: "Contact Info Title" },
  { key: "page_contact_social_title", content: "Follow Us", title: "Contact Social Title" },
  { key: "page_contact_faq_title", content: "Frequently Asked", title: "Contact FAQ Title" },

  { key: "page_careers_title", content: "Join Our Team", title: "Careers Page Title" },
  { key: "page_careers_subtitle", content: "Be part of Islamabad's premier sports and recreation destination", title: "Careers Page Subtitle" },
  { key: "page_careers_benefits_title", content: "Why Work With Us", title: "Careers Benefits Title" },
  { key: "page_careers_positions_title", content: "Open Positions", title: "Careers Positions Title" },
  { key: "page_careers_apply_cta", content: "Apply Now", title: "Careers Apply CTA" },
  { key: "page_careers_no_positions", content: "No open positions at this time. Check back soon!", title: "Careers No Positions" },

  { key: "page_events_title", content: "Events & Academies", title: "Events Page Title" },
  { key: "page_events_subtitle", content: "Tournaments, leagues, and training programs", title: "Events Page Subtitle" },
  { key: "page_events_upcoming_title", content: "Upcoming Events", title: "Events Upcoming Title" },
  { key: "page_events_no_events", content: "No events scheduled at this time. Check back soon!", title: "Events No Events" },
  { key: "page_events_register_cta", content: "Register Now", title: "Events Register CTA" },

  { key: "page_gallery_title", content: "Gallery & Progress", title: "Gallery Page Title" },
  { key: "page_gallery_subtitle", content: "Explore architectural renders, construction updates, and facility photos from The Quarterdeck sports complex.", title: "Gallery Page Subtitle" },
  { key: "page_gallery_construction_title", content: "Construction Progress", title: "Gallery Construction Title" },
  { key: "page_gallery_renders_title", content: "Architectural Renders", title: "Gallery Renders Title" },

  { key: "page_leaderboard_title", content: "Leaderboard", title: "Leaderboard Page Title" },
  { key: "page_leaderboard_subtitle", content: "Top players across all sports at The Quarterdeck", title: "Leaderboard Page Subtitle" },
  { key: "page_leaderboard_top_players", content: "Top Players", title: "Leaderboard Top Players" },
  { key: "page_leaderboard_coming_soon", content: "Leaderboard will be available after launch.", title: "Leaderboard Coming Soon" },

  { key: "page_roadmap_title", content: "Development Roadmap", title: "Roadmap Page Title" },
  { key: "page_roadmap_subtitle", content: "Follow our journey from groundbreaking to grand opening", title: "Roadmap Page Subtitle" },
  { key: "page_roadmap_timeline_title", content: "Construction Timeline", title: "Roadmap Timeline Title" },

  { key: "page_rules_title", content: "Rules & Safety", title: "Rules Page Title" },
  { key: "page_rules_subtitle", content: "For the safety and enjoyment of all members, please familiarize yourself with our facility rules", title: "Rules Page Subtitle" },
  { key: "page_rules_general_title", content: "General Rules", title: "Rules General Title" },
  { key: "page_rules_safety_title", content: "Safety Guidelines", title: "Rules Safety Title" },

  { key: "page_faq_title", content: "Frequently Asked Questions", title: "FAQ Page Title" },
  { key: "page_faq_subtitle", content: "Find answers to common questions about The Quarterdeck, memberships, bookings, and more.", title: "FAQ Page Subtitle" },
  { key: "page_faq_contact_cta", content: "Still have questions? Contact us", title: "FAQ Contact CTA" },

  { key: "page_vision_title", content: "Our Vision", title: "Vision Page Title" },
  { key: "page_vision_subtitle", content: "Building Islamabad's premier sports and recreation destination", title: "Vision Page Subtitle" },
  { key: "page_vision_mission_title", content: "Our Mission", title: "Vision Mission Title" },
  { key: "page_vision_values_title", content: "Our Values", title: "Vision Values Title" },

  { key: "page_privacy_title", content: "Privacy Policy", title: "Privacy Page Title" },
  { key: "page_privacy_subtitle", content: "Last updated: December 2025", title: "Privacy Page Subtitle" },

  { key: "page_terms_title", content: "Terms & Conditions", title: "Terms Page Title" },
  { key: "page_terms_subtitle", content: "Last updated: December 2025", title: "Terms Page Subtitle" },

  { key: "page_booking_title", content: "Book a Court", title: "Booking Page Title" },
  { key: "page_booking_subtitle", content: "Select your facility, date, and time slot", title: "Booking Page Subtitle" },
  { key: "page_booking_login_required", content: "Please log in to book", title: "Booking Login Required" },
  { key: "page_booking_select_facility", content: "Select Facility", title: "Booking Select Facility" },

  // Error Messages
  { key: "error_generic", content: "Something went wrong. Please try again.", title: "Error Generic" },
  { key: "error_network", content: "Unable to connect. Please check your internet connection.", title: "Error Network" },
  { key: "error_not_found", content: "The requested resource was not found.", title: "Error Not Found" },
  { key: "error_unauthorized", content: "Please log in to access this feature.", title: "Error Unauthorized" },
  { key: "error_forbidden", content: "You do not have permission to access this resource.", title: "Error Forbidden" },

  // Success Messages
  { key: "success_booking", content: "Your booking has been confirmed!", title: "Success Booking" },
  { key: "success_registration", content: "Registration successful! Welcome to The Quarterdeck.", title: "Success Registration" },
  { key: "success_contact", content: "Your message has been sent. We'll respond within 24-48 hours.", title: "Success Contact" },
  { key: "success_profile_update", content: "Your profile has been updated successfully.", title: "Success Profile Update" },
];

export async function seedCmsContent(): Promise<CmsSeedResult> {
  console.log("Seeding CMS content...");
  
  const result: CmsSeedResult = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  for (const seed of CMS_SEEDS) {
    try {
      const existing = await db
        .select()
        .from(cmsContent)
        .where(eq(cmsContent.key, seed.key))
        .limit(1);

      if (existing.length > 0) {
        result.skipped++;
        continue;
      }

      await db.insert(cmsContent).values({
        key: seed.key,
        content: seed.content,
        title: seed.title,
        isActive: true,
      });

      result.created++;
      console.log(`  Created CMS key: ${seed.key}`);
    } catch (error) {
      console.error(`  Error seeding ${seed.key}:`, error);
    }
  }

  console.log(`CMS seeding complete: ${result.created} created, ${result.skipped} skipped (already exist)`);
  return result;
}

export async function updateCmsContent(): Promise<CmsSeedResult> {
  console.log("Updating CMS content (will update existing values)...");
  
  const result: CmsSeedResult = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  for (const seed of CMS_SEEDS) {
    try {
      const existing = await db
        .select()
        .from(cmsContent)
        .where(eq(cmsContent.key, seed.key))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(cmsContent)
          .set({
            content: seed.content,
            title: seed.title,
            updatedAt: new Date(),
          })
          .where(eq(cmsContent.key, seed.key));
        result.updated++;
      } else {
        await db.insert(cmsContent).values({
          key: seed.key,
          content: seed.content,
          title: seed.title,
          isActive: true,
        });
        result.created++;
      }
    } catch (error) {
      console.error(`  Error updating ${seed.key}:`, error);
    }
  }

  console.log(`CMS update complete: ${result.created} created, ${result.updated} updated`);
  return result;
}
