import type { Lead } from "@/lib/types";
import { hasWhatsApp } from "@/lib/channels";
import { buildWhatsAppWebUrl, composeWhatsAppMessage, normalizePhoneForWaMe } from "@/lib/whatsapp";

export function WhatsAppListLink({ lead }: { lead: Lead }) {
  if (!hasWhatsApp(lead.phone)) return null;
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
