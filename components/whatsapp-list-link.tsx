import type { Lead } from "@/lib/types";
import { hasWhatsApp } from "@/lib/channels";
import { buildWhatsAppWebUrl, composeWhatsAppMessage, normalizePhoneForWaMe } from "@/lib/whatsapp";

export function WhatsAppListLink({
  lead,
  templateBody,
}: {
  lead: Lead;
  templateBody?: string | null;
}) {
  if (!hasWhatsApp(lead.phone)) return null;
  const digits = normalizePhoneForWaMe(lead.phone);
  if (!digits) return null;

  return (
    <a
      href={buildWhatsAppWebUrl(digits, composeWhatsAppMessage(lead, templateBody))}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-brand hover:underline"
      title="פתיחה ב-WhatsApp Web"
    >
      וואטסאפ
    </a>
  );
}
