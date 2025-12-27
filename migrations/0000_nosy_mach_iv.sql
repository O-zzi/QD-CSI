CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."construction_phase_status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('ACADEMY', 'TOURNAMENT', 'CLASS', 'SOCIAL');--> statement-breakpoint
CREATE TYPE "public"."facility_status" AS ENUM('OPENING_SOON', 'PLANNED', 'ACTIVE');--> statement-breakpoint
CREATE TYPE "public"."membership_application_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'ACTIVE', 'EXPIRED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."membership_tier" AS ENUM('FOUNDING', 'GOLD', 'SILVER', 'GUEST');--> statement-breakpoint
CREATE TYPE "public"."payer_type" AS ENUM('SELF', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."venue_status" AS ENUM('ACTIVE', 'COMING_SOON', 'PLANNED');--> statement-breakpoint
CREATE TABLE "admin_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar,
	"admin_email" varchar NOT NULL,
	"action" varchar NOT NULL,
	"resource" varchar NOT NULL,
	"resource_id" varchar,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"content" text,
	"category" varchar,
	"published_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"title" varchar NOT NULL,
	"excerpt" text,
	"content" text,
	"featured_image_url" varchar,
	"author" varchar,
	"category" varchar,
	"tags" text[],
	"read_time_minutes" integer DEFAULT 5,
	"published_at" timestamp,
	"is_published" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blogs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "booking_add_ons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"add_on_id" varchar NOT NULL,
	"label" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_per_unit" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"facility_id" varchar NOT NULL,
	"venue" varchar DEFAULT 'Islamabad' NOT NULL,
	"resource_id" integer DEFAULT 1 NOT NULL,
	"date" varchar NOT NULL,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method" varchar DEFAULT 'cash',
	"payer_type" "payer_type" DEFAULT 'SELF',
	"payer_membership_number" varchar,
	"base_price" integer DEFAULT 0,
	"discount" integer DEFAULT 0,
	"add_on_total" integer DEFAULT 0,
	"total_price" integer DEFAULT 0 NOT NULL,
	"coach_booked" boolean DEFAULT false,
	"is_matchmaking" boolean DEFAULT false,
	"current_players" integer DEFAULT 1,
	"max_players" integer DEFAULT 4,
	"hall_activity" varchar,
	"stripe_session_id" varchar,
	"stripe_payment_intent_id" varchar,
	"payment_status" "payment_status" DEFAULT 'PENDING_PAYMENT',
	"payment_proof_url" varchar,
	"payment_verified_by" varchar,
	"payment_verified_at" timestamp,
	"payment_notes" text,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "career_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"career_id" varchar,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"cover_letter" text,
	"cv_url" varchar,
	"cv_file_name" varchar,
	"linkedin_url" varchar,
	"status" varchar DEFAULT 'NEW',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "career_benefits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"department" varchar,
	"location" varchar DEFAULT 'Islamabad',
	"type" varchar DEFAULT 'Full-time',
	"description" text,
	"requirements" text,
	"salary" varchar,
	"salary_hidden" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certification_classes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certification_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"instructor" varchar,
	"scheduled_date" timestamp,
	"duration" integer DEFAULT 60,
	"capacity" integer DEFAULT 10,
	"enrolled_count" integer DEFAULT 0,
	"price" integer DEFAULT 0,
	"location" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certification_enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar DEFAULT 'ENROLLED',
	"completed_at" timestamp,
	"score" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"facility_id" varchar,
	"validity_months" integer DEFAULT 12,
	"requirements" text,
	"icon" varchar,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "certifications_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cms_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"title" varchar,
	"content" text,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cms_content_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "cms_fields" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_slug" varchar NOT NULL,
	"section" varchar,
	"field_key" varchar NOT NULL,
	"field_type" varchar DEFAULT 'text',
	"label" varchar NOT NULL,
	"value" text,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cms_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cms_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comparison_features" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature" varchar NOT NULL,
	"founding_value" varchar,
	"gold_value" varchar,
	"silver_value" varchar,
	"guest_value" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "construction_phases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar NOT NULL,
	"title" varchar NOT NULL,
	"status" "construction_phase_status" DEFAULT 'NOT_STARTED',
	"progress" integer DEFAULT 0,
	"is_active" boolean DEFAULT false,
	"is_complete" boolean DEFAULT false,
	"timeframe" varchar,
	"milestones" jsonb DEFAULT '[]'::jsonb,
	"highlights" jsonb DEFAULT '[]'::jsonb,
	"icon" varchar DEFAULT 'clock',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"subject" varchar,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'UNREAD',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ctas" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"title" varchar NOT NULL,
	"subtitle" text,
	"description" text,
	"button_text" varchar,
	"button_link" varchar,
	"secondary_button_text" varchar,
	"secondary_button_link" varchar,
	"background_image_url" varchar,
	"background_color" varchar,
	"style" varchar DEFAULT 'default',
	"page" varchar,
	"section" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ctas_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "event_galleries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar,
	"image_url" varchar NOT NULL,
	"caption" text,
	"alt_text" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"user_id" varchar,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"guest_count" integer DEFAULT 0,
	"notes" text,
	"status" varchar DEFAULT 'REGISTERED',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"type" "event_type" DEFAULT 'CLASS' NOT NULL,
	"instructor" varchar,
	"schedule_day" varchar,
	"schedule_time" varchar,
	"schedule_datetime" timestamp,
	"price" integer DEFAULT 0,
	"capacity" integer DEFAULT 20,
	"enrolled_count" integer DEFAULT 0,
	"enrollment_deadline" timestamp,
	"image_url" varchar,
	"slug" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar,
	"category" varchar,
	"base_price" integer DEFAULT 0 NOT NULL,
	"min_players" integer DEFAULT 1,
	"resource_count" integer DEFAULT 1,
	"requires_certification" boolean DEFAULT false,
	"is_restricted" boolean DEFAULT false,
	"is_hidden" boolean DEFAULT false,
	"status" "facility_status" DEFAULT 'PLANNED',
	"image_url" varchar,
	"about_content" text,
	"features" text[],
	"amenities" text[],
	"keywords" text[],
	"quick_info" jsonb,
	"pricing_notes" text,
	"certification_info" text,
	"gallery_images" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "facilities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "facility_add_ons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"label" varchar NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"icon" varchar,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facility_venues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"venue_id" varchar NOT NULL,
	"status" "venue_status" DEFAULT 'PLANNED',
	"resource_count" integer DEFAULT 1,
	"price_override" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "faq_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"icon" varchar DEFAULT 'help-circle',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gallery_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"image_url" varchar NOT NULL,
	"category" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hall_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" text,
	"icon" varchar,
	"base_price" integer DEFAULT 0,
	"price_per_hour" integer DEFAULT 0,
	"min_hours" integer DEFAULT 1,
	"max_hours" integer DEFAULT 8,
	"max_capacity" integer,
	"min_capacity" integer DEFAULT 1,
	"resources_required" integer DEFAULT 1,
	"requires_approval" boolean DEFAULT false,
	"requires_deposit" boolean DEFAULT false,
	"deposit_amount" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hall_activities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hero_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" varchar NOT NULL,
	"title" varchar NOT NULL,
	"subtitle" text,
	"description" text,
	"background_image_url" varchar,
	"background_video_url" varchar,
	"overlay_opacity" integer DEFAULT 50,
	"cta_text" varchar,
	"cta_link" varchar,
	"cta_secondary_text" varchar,
	"cta_secondary_link" varchar,
	"alignment" varchar DEFAULT 'center',
	"height" varchar DEFAULT 'large',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hero_sections_page_unique" UNIQUE("page")
);
--> statement-breakpoint
CREATE TABLE "leaderboard" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"facility_id" varchar,
	"score" integer DEFAULT 0,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"ranking_points" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_benefits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"icon" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "membership_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"tier_desired" "membership_tier" NOT NULL,
	"payment_method" varchar DEFAULT 'bank_transfer',
	"payment_amount" integer DEFAULT 0,
	"payment_proof_url" varchar,
	"payment_reference" varchar,
	"status" "membership_application_status" DEFAULT 'PENDING',
	"admin_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "membership_tier_definitions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"color" varchar DEFAULT '#6B7280',
	"discount_percent" integer DEFAULT 0,
	"guest_passes_included" integer DEFAULT 0,
	"benefits" text[],
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "membership_tier_definitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"membership_number" varchar NOT NULL,
	"tier" "membership_tier" DEFAULT 'GUEST' NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp NOT NULL,
	"status" "membership_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"guest_passes" integer DEFAULT 0,
	"payment_reference" varchar,
	"payment_claimed_at" timestamp,
	"payment_verified_at" timestamp,
	"payment_verified_by" varchar,
	"payment_rejected_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "memberships_membership_number_unique" UNIQUE("membership_number")
);
--> statement-breakpoint
CREATE TABLE "navbar_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar NOT NULL,
	"href" varchar NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"target" varchar DEFAULT '_self',
	"requires_auth" boolean DEFAULT false,
	"icon" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"link" varchar,
	"is_read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "operating_hours" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" varchar,
	"facility_id" varchar,
	"day_of_week" integer NOT NULL,
	"open_time" varchar NOT NULL,
	"close_time" varchar NOT NULL,
	"slot_duration_minutes" integer DEFAULT 60,
	"is_holiday" boolean DEFAULT false,
	"is_closed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" varchar NOT NULL,
	"section" varchar NOT NULL,
	"key" varchar NOT NULL,
	"title" varchar,
	"content" text,
	"icon" varchar,
	"image_url" varchar,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "peak_windows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" varchar,
	"facility_id" varchar,
	"name" varchar NOT NULL,
	"day_of_week" integer,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"is_peak" boolean DEFAULT true,
	"discount_disabled" boolean DEFAULT false,
	"founding_discount" integer DEFAULT 25,
	"gold_discount" integer DEFAULT 20,
	"silver_discount" integer DEFAULT 10,
	"guest_discount" integer DEFAULT 0,
	"founding_booking_window" integer DEFAULT 14,
	"gold_booking_window" integer DEFAULT 7,
	"silver_booking_window" integer DEFAULT 5,
	"guest_booking_window" integer DEFAULT 2,
	"season_start" timestamp,
	"season_end" timestamp,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"tier" "membership_tier" NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"billing_period" varchar DEFAULT 'yearly',
	"benefits" text[],
	"is_popular" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"tagline" varchar,
	"description" text,
	"is_closed" boolean DEFAULT false,
	"discount_percent" integer DEFAULT 0,
	"advance_booking_days" integer DEFAULT 2,
	"guest_passes_included" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"category" varchar,
	"content" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar,
	"image_url" text,
	"alt" varchar,
	"title" varchar,
	"description" text,
	"page" varchar,
	"section" varchar,
	"dimensions" varchar,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_images_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"value" text,
	"type" varchar DEFAULT 'text',
	"label" varchar,
	"category" varchar DEFAULT 'general',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"title" varchar,
	"company" varchar,
	"avatar_url" varchar,
	"quote" text NOT NULL,
	"rating" integer DEFAULT 5,
	"facility_id" varchar,
	"is_featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_slot_blocks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" varchar NOT NULL,
	"resource_id" integer DEFAULT 1,
	"date" varchar NOT NULL,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"reason" varchar,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"certification_id" varchar NOT NULL,
	"certificate_number" varchar,
	"issued_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"status" varchar DEFAULT 'ACTIVE',
	"issued_by" varchar,
	"proof_document_url" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_certifications_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"phone" varchar,
	"date_of_birth" timestamp,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"is_safety_certified" boolean DEFAULT false,
	"has_signed_waiver" boolean DEFAULT false,
	"credit_balance" integer DEFAULT 0,
	"total_hours_played" integer DEFAULT 0,
	"stripe_customer_id" varchar,
	"email_verified" boolean DEFAULT false,
	"email_verification_token" varchar,
	"email_verification_expires" timestamp,
	"password_reset_token" varchar,
	"password_reset_expires" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"lockout_until" timestamp,
	"terms_accepted_at" timestamp,
	"last_authenticated_at" timestamp,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"city" varchar NOT NULL,
	"country" varchar DEFAULT 'Pakistan',
	"status" "venue_status" DEFAULT 'PLANNED',
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_add_ons" ADD CONSTRAINT "booking_add_ons_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_classes" ADD CONSTRAINT "certification_classes_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_enrollments" ADD CONSTRAINT "certification_enrollments_class_id_certification_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."certification_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_enrollments" ADD CONSTRAINT "certification_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_galleries" ADD CONSTRAINT "event_galleries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_add_ons" ADD CONSTRAINT "facility_add_ons_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_venues" ADD CONSTRAINT "facility_venues_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_venues" ADD CONSTRAINT "facility_venues_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_category_id_faq_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."faq_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hall_activities" ADD CONSTRAINT "hall_activities_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_payment_verified_by_users_id_fk" FOREIGN KEY ("payment_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peak_windows" ADD CONSTRAINT "peak_windows_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peak_windows" ADD CONSTRAINT "peak_windows_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot_blocks" ADD CONSTRAINT "time_slot_blocks_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot_blocks" ADD CONSTRAINT "time_slot_blocks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_admin" ON "admin_audit_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "admin_audit_logs" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "admin_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_operating_hours_venue_day" ON "operating_hours" USING btree ("venue_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_operating_hours_facility_day" ON "operating_hours" USING btree ("facility_id","day_of_week");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");