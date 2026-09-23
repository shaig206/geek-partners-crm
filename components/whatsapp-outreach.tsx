"use client";

import { useState } from "react";
import { copyTextToClipboard } from "@/components/copy-text";
import { buildWhatsAppWebUrl } from "@/lib/whatsapp";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";

const secondaryButtonClass =
  "rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card";

const primaryLinkClass =
  "inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark";

export function WhatsAppOutreach({
  digits,
  defaultMessage,
}: {
  digits: string;
  defaultMessage: string;
}) {
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const webUrl = buildWhatsAppWebUrl(digits, message);

  async function copyMessage() {
    setCopyError(false);
    try {
      await copyTextToClipboard(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        לא נשלח מהמערכת — רק העתקה ופתיחה ב-WhatsApp Web על המחשב.
      </p>
      <label className="block text-sm">
        הודעה מוצעת
        <textarea
          rows={12}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={inputClass}
        />
      </label>
      <p className="text-xs text-muted">
        ייפתח ל־<span dir="ltr">+{digits}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyMessage} className={secondaryButtonClass}>
          {copied ? "הועתק" : "העתקה"}
        </button>
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className={primaryLinkClass}>
          פתיחה ב-WhatsApp Web
        </a>
      </div>
      {copyError ? <p className="text-sm text-red-700">ההעתקה נכשלה. אפשר לסמן את הטקסט ידנית.</p> : null}
    </div>
  );
}
