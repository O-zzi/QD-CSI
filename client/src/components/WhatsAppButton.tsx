import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type SiteSettings = { [key: string]: string };

export function WhatsAppButton() {
  const { data: siteSettings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/site-settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return {};
        const data = await res.json();
        return data && typeof data === 'object' && !data.message ? data : {};
      } catch {
        return {};
      }
    },
  });
  
  const isVisible = siteSettings?.whatsapp_button_visible === 'true';
  const phone = siteSettings?.whatsapp_phone || '';
  const defaultMessage = siteSettings?.whatsapp_default_message || '';
  const buttonText = siteSettings?.whatsapp_button_text || 'Chat on WhatsApp';
  
  if (isLoading || !isVisible || !phone) {
    return null;
  }
  
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = window.encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${cleanPhone}${defaultMessage ? `?text=${encodedMessage}` : ''}`;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group"
      data-testid="button-whatsapp-float"
      aria-label={buttonText}
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden sm:inline font-medium">{buttonText}</span>
    </a>
  );
}
