import { whatsappLink } from "@/config/site";
import { WhatsAppIcon } from "@/components/brand-icons";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink("Olá, Belart! Vim pelo site e gostaria de mais informações.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Belart pelo WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 md:right-6 md:bottom-6"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}
