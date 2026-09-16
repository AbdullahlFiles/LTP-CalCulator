"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function UpgradeButton() {
  const { status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "unauthenticated") {
    return (
      <Link
        href="/login"
        className="inline-block rounded bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Sign in to upgrade
      </Link>
    );
  }

  async function handleUpgrade() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage(body.error ?? "Upgrade failed");
      return;
    }

    if (body.mode === "redirect" && body.redirectUrl) {
      window.location.href = body.redirectUrl;
      return;
    }

    // Dev/demo provider: the plan already changed in the database.
    setMessage("Upgraded (demo mode — no real payment was processed; see note below).");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={busy}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {busy ? "Processing…" : "Upgrade to Premium"}
      </button>
      {message && <p className="mt-2 text-sm text-neutral-500">{message}</p>}
    </div>
  );
}
