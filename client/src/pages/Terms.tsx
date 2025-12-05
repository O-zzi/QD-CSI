import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using The Quarterdeck facilities and services, you agree to be bound by 
              these Terms and Conditions. If you do not agree to these terms, please do not use our 
              facilities or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">2. Membership</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Membership at The Quarterdeck is subject to approval and payment of applicable fees. 
              Members must provide accurate personal information and maintain current contact details.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Membership is non-transferable unless explicitly approved by management</li>
              <li>Members must present valid identification when requested</li>
              <li>Annual membership fees are non-refundable after the 30-day cooling-off period</li>
              <li>Guest privileges are subject to availability and member tier</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">3. Facility Usage</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All members and guests must adhere to facility rules and regulations:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Proper athletic attire and footwear required for all sports facilities</li>
              <li>Bookings must be made in advance through the official booking system</li>
              <li>Cancellations must be made at least 24 hours before the scheduled time</li>
              <li>No-shows may result in forfeiture of booking credits</li>
              <li>Equipment must be used responsibly and returned in good condition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">4. Safety & Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Members participate in activities at their own risk. The Quarterdeck provides safety 
              equipment and guidelines, but members are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Completing required safety certifications before using specialized equipment</li>
              <li>Following all safety instructions provided by staff</li>
              <li>Reporting any injuries or safety concerns immediately</li>
              <li>Ensuring guests understand and follow all safety protocols</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">5. Code of Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Members and guests are expected to conduct themselves professionally and respectfully:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Treat all staff, members, and guests with respect</li>
              <li>Maintain appropriate noise levels in all areas</li>
              <li>No smoking, alcohol, or prohibited substances on premises</li>
              <li>Harassment of any kind will result in immediate membership termination</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">6. Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              All fees and charges are due as specified at the time of booking or membership renewal. 
              Late payments may result in suspension of booking privileges. Disputed charges must be 
              reported within 30 days of the transaction date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">7. Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Quarterdeck reserves the right to modify these terms at any time. Members will be 
              notified of significant changes via email or through the member portal. Continued use 
              of facilities after changes constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#2a4060] mb-4">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms & Conditions, please contact us at{" "}
              <a href="mailto:legal@thequarterdeck.pk" className="text-[#2a4060] hover:underline">
                legal@thequarterdeck.pk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
