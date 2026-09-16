"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage, ExplanationMode, StructuredExplanation } from "@ltp/ai";

interface ExplainResponse extends StructuredExplanation {
  cacheHit: boolean;
}

const SECTION_LABELS: { key: keyof StructuredExplanation & string; label: string; hint: string }[] = [
  { key: "data", label: "Data", hint: "Facts read directly from the current chain." },
  { key: "calculation", label: "Calculation", hint: "How each number was computed." },
  { key: "interpretation", label: "Interpretation", hint: "A possible reading — always hedged, never certain." },
  { key: "uncertainty", label: "Uncertainty", hint: "What this data does NOT tell you." },
];

export function AiInsights({
  instrument,
  expiry,
  mode,
}: {
  instrument: string;
  expiry: string;
  mode: ExplanationMode;
}) {
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatProvider, setChatProvider] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      setStatus("loading");
      try {
        const res = await fetch(
          `/api/ai/explain?instrument=${instrument}&expiry=${expiry}&mode=${mode}${force ? "&force=true" : ""}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }
        const body: ExplainResponse = await res.json();
        setExplanation(body);
        setStatus("ready");
        setErrorMessage(null);
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      }
    },
    [instrument, expiry, mode],
  );

  useEffect(() => {
    setMessages([]);
    load();
  }, [load]);

  const sendQuestion = useCallback(async () => {
    const trimmed = question.trim();
    if (trimmed === "" || chatBusy) return;

    const nextHistory: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setQuestion("");
    setChatBusy(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrument, expiry, question: trimmed, history: messages }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      setChatProvider(body.provider ?? null);
      setMessages([...nextHistory, { role: "assistant", content: body.answer }]);
    } catch (error) {
      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: `Sorry, I couldn't answer that: ${error instanceof Error ? error.message : "unknown error"}`,
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  }, [question, chatBusy, messages, instrument, expiry]);

  const generatedByLabel = useMemo(() => {
    if (!explanation) return null;
    return explanation.generatedBy === "template"
      ? "Rule-based (no external AI configured)"
      : `AI: ${explanation.generatedBy}`;
  }, [explanation]);

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">AI Insights</div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {generatedByLabel && <span>{generatedByLabel}</span>}
          {explanation?.cacheHit && <span className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">cached</span>}
          <button
            type="button"
            onClick={() => load(true)}
            className="rounded border border-neutral-300 px-2 py-0.5 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Refresh
          </button>
        </div>
      </div>

      {status === "loading" && !explanation && (
        <div className="mt-3 text-sm text-neutral-400" role="status">
          Generating explanation…
        </div>
      )}

      {status === "error" && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          Could not load AI insights: {errorMessage}
        </div>
      )}

      {explanation && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SECTION_LABELS.map(({ key, label, hint }) => (
            <div key={key}>
              <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500" title={hint}>
                {label}
              </div>
              <ul className="mt-1 space-y-1 text-sm">
                {(explanation[key] as string[]).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Ask about this chain</span>
          {chatProvider && <span>{chatProvider}</span>}
        </div>
        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded px-2 py-1 ${
                m.role === "user"
                  ? "ml-auto max-w-[80%] bg-neutral-900 text-white dark:bg-white dark:text-black"
                  : "mr-auto max-w-[80%] bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendQuestion();
            }}
            placeholder="e.g. What does the current PCR suggest?"
            className="flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            disabled={chatBusy}
          />
          <button
            type="button"
            onClick={sendQuestion}
            disabled={chatBusy || question.trim() === ""}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {chatBusy ? "…" : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}
