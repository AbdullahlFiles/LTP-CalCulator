"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCancel() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage(body.error ?? "Cancellation failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={busy}
        className="text-xs text-red-600 underline disabled:opacity-50 dark:text-red-400"
      >
        {busy ? "Cancelling…" : "Cancel Premium"}
      </button>
      {message && <p className="mt-1 text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
