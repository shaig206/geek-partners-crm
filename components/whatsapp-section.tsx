import { WhatsAppOutreach } from "@/components/whatsapp-outreach";
import type { Lead } from "@/lib/types";
import { composeWhatsAppMessage, normalizePhoneForWaMe } from "@/lib/whatsapp";

export function WhatsAppSection({ lead }: { lead: Lead }) {
  const digits = normalizePhoneForWaMe(lead.phone);
  const defaultMessage = composeWhatsAppMessage(lead);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">וואטסאפ</h2>
      {digits ? (
        <WhatsAppOutreach key={`${digits}:${defaultMessage}`} digits={digits} defaultMessage={defaultMessage} />
      ) : (
        <p className="text-sm text-muted">
          כדי להעתיק הודעה ולפתוח צ׳אט ב-WhatsApp Web צריך מספר טלפון.{" "}
          <a href="#lead-contact" className="text-brand hover:underline">
            הוסיפו טלפון בכרטיס
          </a>
        </p>
      )}
    </section>
  );
}
