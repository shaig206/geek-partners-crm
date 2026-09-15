import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">העמוד לא נמצא</h1>
      <p className="mt-2 text-sm text-muted">ייתכן שהליד נמחק או שהקישור שגוי.</p>
      <Link href="/leads" className="mt-6 inline-block text-sm text-brand hover:underline">
        חזרה ללידים
      </Link>
    </div>
  );
}
