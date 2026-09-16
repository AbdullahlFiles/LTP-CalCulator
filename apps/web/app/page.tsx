import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-semibold">NSE LTP Calculator + Options Intelligence</h1>
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">
        A free-first NSE options intelligence platform, currently in early development. See{" "}
        <code>docs/ROADMAP.md</code> for the phase-by-phase build plan.
      </p>
      <Link
        href="/ltp-calculator"
        className="mt-6 inline-block rounded bg-neutral-900 px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Open the LTP Calculator →
      </Link>
    </main>
  );
}
