import { MarkLeadSentButton } from "@/components/mark-lead-sent-button";
import { WhatsAppOutreach } from "@/components/whatsapp-outreach";
import { FOLLOW_UP_DAYS_AFTER_SEND } from "@/lib/constants";
import { hasWhatsApp } from "@/lib/channels";
import type { Lead } from "@/lib/types";
import { composeWhatsAppMessage, normalizePhoneForWaMe } from "@/lib/whatsapp";

export function WhatsAppSection({ lead }: { lead: Lead }) {
  const canWhatsApp = hasWhatsApp(lead.phone);
  const digits = canWhatsApp ? normalizePhoneForWaMe(lead.phone) : null;
  const defaultMessage = composeWhatsAppMessage(lead);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">וואטסאפ</h2>
      {digits ? (
        <WhatsAppOutreach key={`${digits}:${defaultMessage}`} digits={digits} defaultMessage={defaultMessage} />
      ) : lead.phone?.trim() ? (
        <p className="text-sm text-muted">
          המספר השמור אינו נייד ישראלי שמתחיל ב־05. וואטסאפ בסינון ובשליחה מיועד לניידים בלבד (לא קווי 02/03/04/07/08/09).
        </p>
      ) : (
        <p className="text-sm text-muted">
          כדי להעתיק הודעה ולפתוח צ׳אט ב-WhatsApp Web צריך מספר טלפון נייד (05).{" "}
          <a href="#lead-contact" className="text-brand hover:underline">
            הוסיפו טלפון בכרטיס
          </a>
        </p>
      )}
      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs text-muted">
          אחרי שליחה ידנית — סמנו כאן. סטטוס התקשורת יהיה נשלחה הודעה והמעקב הראשון ייקבע לעוד{" "}
          {FOLLOW_UP_DAYS_AFTER_SEND} ימים.
        </p>
        <MarkLeadSentButton leadId={lead.id} channel="whatsapp" label="סימנתי שנשלח בוואטסאפ" />
      </div>
    </section>
  );
}
