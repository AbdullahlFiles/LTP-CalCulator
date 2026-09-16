"use client";

import { useState } from "react";
import type { WatchlistItem } from "@ltp/db";

export function WatchlistPanel({
  initialItems,
  limit,
}: {
  initialItems: WatchlistItem[];
  limit: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function removeItem(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((current) => current.filter((i) => i.id !== id));
    }
    setBusyId(null);
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Watchlist</h2>
        <span className="text-xs text-neutral-500">
          {items.length} / {limit}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">
          Nothing saved yet. Add strikes to your watchlist from the Option Chain page.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded border border-neutral-100 px-2 py-1.5 dark:border-neutral-800">
              <span>
                {item.instrument}
                {item.strike !== null ? ` ${item.strike}${item.optionType ?? ""}` : ""}
                {item.expiry ? ` · ${item.expiry}` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={busyId === item.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
