import type { Lead } from "@/lib/types";
import { buildWhatsAppWebUrl, composeWhatsAppMessage, normalizePhoneForWaMe } from "@/lib/whatsapp";

export function WhatsAppListLink({ lead }: { lead: Lead }) {
  const digits = normalizePhoneForWaMe(lead.phone);
  if (!digits) return null;

  return (
    <a
      href={buildWhatsAppWebUrl(digits, composeWhatsAppMessage(lead))}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-brand hover:underline"
      title="פתיחה ב-WhatsApp Web"
    >
      וואטסאפ
    </a>
  );
}
