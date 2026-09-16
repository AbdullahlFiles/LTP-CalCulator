"use client";

import { useState } from "react";
import type { Alert, AlertTrigger } from "@ltp/db";
import { INSTRUMENTS, getMockExpiries } from "@/lib/instruments";

type AlertWithTriggers = Alert & { triggers: AlertTrigger[] };

const ALERT_TYPES: { value: string; label: string; needsStrike: boolean; needsOptionType: boolean; needsOperator: boolean; needsThreshold: boolean }[] = [
  { value: "LTP_THRESHOLD", label: "LTP crosses threshold", needsStrike: true, needsOptionType: true, needsOperator: true, needsThreshold: true },
  { value: "PERCENT_MOVE", label: "% move at/beyond threshold", needsStrike: true, needsOptionType: true, needsOperator: false, needsThreshold: true },
  { value: "OI_CHANGE", label: "OI % change at/beyond threshold", needsStrike: true, needsOptionType: true, needsOperator: false, needsThreshold: true },
  { value: "VOLUME_SPIKE", label: "Volume reaches threshold", needsStrike: true, needsOptionType: true, needsOperator: false, needsThreshold: true },
  { value: "IV_THRESHOLD", label: "IV crosses threshold", needsStrike: true, needsOptionType: true, needsOperator: true, needsThreshold: true },
  { value: "IMPORTANT_STRIKE_MOVE", label: "Strike becomes important", needsStrike: true, needsOptionType: false, needsOperator: false, needsThreshold: false },
  { value: "SR_CROSSING", label: "Underlying crosses level", needsStrike: true, needsOptionType: false, needsOperator: true, needsThreshold: false },
  { value: "UNUSUAL_ACTIVITY", label: "Unusual activity at strike", needsStrike: true, needsOptionType: false, needsOperator: false, needsThreshold: false },
];

const EXPIRIES = getMockExpiries();

export function AlertsPanel({
  initialAlerts,
  limit,
}: {
  initialAlerts: AlertWithTriggers[];
  limit: number;
}) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [instrument, setInstrument] = useState(INSTRUMENTS[0].symbol);
  const [expiry, setExpiry] = useState(EXPIRIES[0]);
  const [type, setType] = useState(ALERT_TYPES[0].value);
  const [strike, setStrike] = useState("25000");
  const [optionType, setOptionType] = useState<"CE" | "PE">("CE");
  const [operator, setOperator] = useState<"gte" | "lte">("gte");
  const [thresholdValue, setThresholdValue] = useState("100");

  const activeCount = alerts.filter((a) => a.active).length;
  const meta = ALERT_TYPES.find((t) => t.value === type)!;

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instrument,
        expiry,
        type,
        strike: meta.needsStrike ? Number(strike) : null,
        optionType: meta.needsOptionType ? optionType : null,
        operator: meta.needsOperator ? operator : null,
        thresholdValue: meta.needsThreshold ? Number(thresholdValue) : null,
      }),
    });
    const body = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create alert");
      return;
    }
    setAlerts((current) => [{ ...body.alert, triggers: [] }, ...current]);
    setShowForm(false);
  }

  async function toggleActive(alert: AlertWithTriggers) {
    const res = await fetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !alert.active }),
    });
    if (res.ok) {
      const body = await res.json();
      setAlerts((current) => current.map((a) => (a.id === alert.id ? { ...a, active: body.alert.active } : a)));
    }
  }

  async function removeAlert(id: string) {
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    if (res.ok) setAlerts((current) => current.filter((a) => a.id !== id));
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Alerts</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {activeCount} / {limit} active
          </span>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="rounded border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
          >
            {showForm ? "Cancel" : "New alert"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createAlert} className="mt-3 space-y-2 rounded border border-neutral-100 p-3 text-sm dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-2">
            <select value={instrument} onChange={(e) => setInstrument(e.target.value)} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
              {INSTRUMENTS.map((i) => (
                <option key={i.symbol} value={i.symbol}>{i.label}</option>
              ))}
            </select>
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
              {EXPIRIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
            {ALERT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            {meta.needsStrike && (
              <input type="number" placeholder="Strike" value={strike} onChange={(e) => setStrike(e.target.value)} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            )}
            {meta.needsOptionType && (
              <select value={optionType} onChange={(e) => setOptionType(e.target.value as "CE" | "PE")} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
                <option value="CE">CE</option>
                <option value="PE">PE</option>
              </select>
            )}
            {meta.needsOperator && (
              <select value={operator} onChange={(e) => setOperator(e.target.value as "gte" | "lte")} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900">
                <option value="gte">Above / at least</option>
                <option value="lte">Below / at most</option>
              </select>
            )}
            {meta.needsThreshold && (
              <input type="number" placeholder="Threshold" value={thresholdValue} onChange={(e) => setThresholdValue(e.target.value)} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" />
            )}
          </div>
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-white disabled:opacity-50 dark:bg-white dark:text-black">
            {busy ? "Creating…" : "Create alert"}
          </button>
        </form>
      )}

      {alerts.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">No alerts yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded border border-neutral-100 px-2 py-1.5 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span>
                  {alert.instrument}
                  {alert.strike !== null ? ` ${alert.strike}${alert.optionType ?? ""}` : ""} —{" "}
                  {ALERT_TYPES.find((t) => t.value === alert.type)?.label ?? alert.type}
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button type="button" onClick={() => toggleActive(alert)} className="underline">
                    {alert.active ? "Pause" : "Resume"}
                  </button>
                  <button type="button" onClick={() => removeAlert(alert.id)} className="text-red-600 underline dark:text-red-400">
                    Delete
                  </button>
                </div>
              </div>
              {alert.triggers.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
                  {alert.triggers.map((trigger) => (
                    <li key={trigger.id}>
                      {new Date(trigger.triggeredAt).toLocaleTimeString("en-IN")} — {trigger.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
