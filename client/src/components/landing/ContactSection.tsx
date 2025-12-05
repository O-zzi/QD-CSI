import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message Sent!",
      description: "Thank you for your interest. We'll get back to you soon.",
    });

    setFormData({ name: "", email: "", message: "" });
    setIsSubmitting(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section id="contact" className="qd-section">
      <div className="qd-container">
        <div className="mb-8">
          <h2 className="qd-section-title" data-testid="text-contact-title">Contact & Early Interest</h2>
          <p className="text-muted-foreground max-w-2xl mt-2">
            Connect with Our Development Team: Use the form to subscribe to our construction updates, inquire about corporate partnerships, or apply for our pre-launch membership waitlist.
          </p>
        </div>

        <div className="qd-contact-grid">
          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Early Interest Form
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              This is a simple placeholder form. In the live site, this can connect to your CRM, email list, or bespoke booking waitlist system.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="rounded-lg"
                data-testid="input-contact-name"
              />
              <Input
                type="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="rounded-lg"
                data-testid="input-contact-email"
              />
              <Textarea
                placeholder="Your Message/Interest (e.g., Padel Coaching, Corporate Event, Career Inquiry)"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="rounded-lg min-h-[100px]"
                data-testid="input-contact-message"
              />
              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={isSubmitting}
                data-testid="button-send-message"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Socials & Location
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Follow our official channels for the most recent updates and progress photos:
            </p>

            <div className="flex gap-3 mb-6">
              <a href="#" className="qd-social-icon" aria-label="Instagram" data-testid="link-contact-instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="qd-social-icon" aria-label="Facebook" data-testid="link-contact-facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="qd-social-icon" aria-label="LinkedIn" data-testid="link-contact-linkedin">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              Site Status
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              The complex is currently under active construction. No public access or walk-ins are permitted for safety reasons. All updates will be digital.
            </p>

            <div className="flex gap-4">
              <Link href="/terms" className="text-sm font-semibold text-[#2a4060] dark:text-blue-400 hover:underline" data-testid="link-terms">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-sm font-semibold text-[#2a4060] dark:text-blue-400 hover:underline" data-testid="link-privacy">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
