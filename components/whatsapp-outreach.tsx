"use client";

import { useState } from "react";
import { buildWhatsAppWebUrl } from "@/lib/whatsapp";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";

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

  async function copyMessage() {
    setCopyError(false);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        fallbackCopy(message);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        fallbackCopy(message);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopyError(true);
      }
    }
  }

  function openWhatsAppWeb() {
    const url = buildWhatsAppWebUrl(digits, message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        לא נשלח מהמערכת — רק העתקה ופתיחה ב-WhatsApp Web על המחשב.
      </p>
      <label className="block text-sm">
        הודעה מוצעת
        <textarea
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={inputClass}
        />
      </label>
      <p className="text-xs text-muted">
        ייפתח ל־<span dir="ltr">+{digits}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyMessage}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-card"
        >
          {copied ? "הועתק" : "העתקה"}
        </button>
        <button
          type="button"
          onClick={openWhatsAppWeb}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          פתיחה ב-WhatsApp Web
        </button>
      </div>
      {copyError ? <p className="text-sm text-red-700">ההעתקה נכשלה. אפשר לסמן את הטקסט ידנית.</p> : null}
    </div>
  );
}

function fallbackCopy(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(el);
  if (!ok) throw new Error("copy failed");
}
