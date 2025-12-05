import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Facebook, Linkedin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";

export function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const { getValue } = useCmsMultiple([
    'contact_title',
    'contact_subtitle',
    'contact_form_title',
    'contact_form_subtitle',
    'contact_submit',
    'contact_socials_title',
    'contact_socials_subtitle',
    'contact_site_status_title',
    'contact_site_status',
    'social_instagram',
    'social_facebook',
    'social_linkedin',
  ], CMS_DEFAULTS);

  const submitMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; message: string }) => {
      return await apiRequest("POST", "/api/contact", {
        name: data.name,
        email: data.email,
        subject: "Early Interest Form Submission",
        message: data.message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for your interest. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", message: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <section id="contact" className="qd-section">
      <div className="qd-container">
        <div className="mb-8">
          <h2 className="qd-section-title" data-testid="text-contact-title">
            {getValue('contact_title') || CMS_DEFAULTS.contact_title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mt-2">
            {getValue('contact_subtitle') || CMS_DEFAULTS.contact_subtitle}
          </p>
        </div>

        <div className="qd-contact-grid">
          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              {getValue('contact_form_title') || CMS_DEFAULTS.contact_form_title}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {getValue('contact_form_subtitle') || CMS_DEFAULTS.contact_form_subtitle}
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
                disabled={submitMutation.isPending}
                data-testid="button-send-message"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  getValue('contact_submit') || CMS_DEFAULTS.contact_submit || "Send Message"
                )}
              </Button>
            </form>
          </div>

          <div className="qd-info-card">
            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              {getValue('contact_socials_title') || 'Socials & Location'}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {getValue('contact_socials_subtitle') || CMS_DEFAULTS.contact_socials_subtitle}
            </p>

            <div className="flex gap-3 mb-6">
              <a href={getValue('social_instagram') || CMS_DEFAULTS.social_instagram} target="_blank" rel="noopener noreferrer" className="qd-social-icon" aria-label="Instagram" data-testid="link-contact-instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={getValue('social_facebook') || CMS_DEFAULTS.social_facebook} target="_blank" rel="noopener noreferrer" className="qd-social-icon" aria-label="Facebook" data-testid="link-contact-facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={getValue('social_linkedin') || CMS_DEFAULTS.social_linkedin} target="_blank" rel="noopener noreferrer" className="qd-social-icon" aria-label="LinkedIn" data-testid="link-contact-linkedin">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            <div className="text-sm font-bold uppercase tracking-wide text-[#2a4060] dark:text-blue-400 mb-3">
              {getValue('contact_site_status_title') || 'Site Status'}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {getValue('contact_site_status') || CMS_DEFAULTS.contact_site_status}
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
