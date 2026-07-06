import { MessageCircle } from "lucide-react";
import { CONTACT, waLink } from "@/config/site";
import { track } from "@/lib/analytics";

export const FloatingWhatsApp = () => (
  <a
    href={waLink("Hello Martial X, I'd like to learn about training and recruitment.")}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
    onClick={() => track("whatsapp_click", { source: "float" })}
    className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
    data-contact={CONTACT.whatsappNumber}
  >
    <MessageCircle className="h-7 w-7" />
    <span className="sr-only">WhatsApp</span>
  </a>
);
