import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#2a4060] py-16">
        <div className="container mx-auto px-6 text-center text-white">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-privacy-title">Privacy Policy</h1>
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
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Quarterdeck collects information to provide and improve our services:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Personal Information:</strong> Name, email, phone number, address, date of birth</li>
              <li><strong>Membership Data:</strong> Membership tier, payment history, booking records</li>
              <li><strong>Usage Information:</strong> Facility usage patterns, preferences, feedback</li>
              <li><strong>Technical Data:</strong> Device information, IP address, browser type when using our website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your information is used to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Process membership applications and renewals</li>
              <li>Manage facility bookings and reservations</li>
              <li>Communicate important updates and announcements</li>
              <li>Improve our facilities and services based on usage patterns</li>
              <li>Ensure safety and security of all members and guests</li>
              <li>Process payments and maintain financial records</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> Payment processors, IT support, communication platforms</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Emergency Services:</strong> In case of safety emergencies</li>
              <li><strong>With Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your information, including 
              encrypted data transmission, secure storage, access controls, and regular security audits. 
              However, no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">5. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">6. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website uses cookies to enhance your experience, remember preferences, and analyze 
              usage patterns. You can control cookie settings through your browser preferences. 
              Essential cookies are required for the website to function properly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as necessary to provide our services and comply 
              with legal obligations. Booking records are kept for 7 years for accounting purposes. 
              You may request deletion of non-essential data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">8. Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. Significant changes will be communicated 
              via email or through our member portal. The date of the last update is shown at the top 
              of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@thequarterdeck.pk" className="text-[#2a4060] hover:underline">
                privacy@thequarterdeck.pk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
