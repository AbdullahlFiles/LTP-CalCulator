"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function AddToWatchlistButton({
  instrument,
  expiry,
  strike,
  optionType,
  label,
}: {
  instrument: string;
  expiry?: string | null;
  strike?: number | null;
  optionType?: "CE" | "PE" | null;
  label: string;
}) {
  const { status } = useSession();
  const [state, setState] = useState<"idle" | "busy" | "added" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (status === "unauthenticated") {
    return (
      <Link href="/login" className="text-xs text-neutral-500 underline">
        Sign in to save to watchlist
      </Link>
    );
  }

  async function handleClick() {
    setState("busy");
    setMessage(null);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instrument,
        expiry: expiry ?? null,
        strike: strike ?? null,
        optionType: optionType ?? null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setState("added");
    } else {
      setState("error");
      setMessage(body.error ?? "Could not add to watchlist");
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "busy" || state === "added"}
        className="rounded border border-neutral-300 px-2 py-0.5 disabled:opacity-60 dark:border-neutral-700"
      >
        {state === "added" ? "Added ✓" : state === "busy" ? "Adding…" : `☆ ${label}`}
      </button>
      {message && <span className="text-red-600 dark:text-red-400">{message}</span>}
    </div>
  );
}
