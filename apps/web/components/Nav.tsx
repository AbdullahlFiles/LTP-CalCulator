"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
      <div className="flex gap-4">
        <Link href="/" className="font-semibold">
          LTP Calculator
        </Link>
        <Link href="/ltp-calculator" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          Calculator
        </Link>
        <Link href="/option-chain" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          Option Chain
        </Link>
        <Link href="/charts" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
          Charts
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {status === "authenticated" && session?.user ? (
          <>
            <Link href="/dashboard" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              Dashboard
            </Link>
            <span className="text-neutral-400">{session.user.email}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
            >
              Sign out
            </button>
          </>
        ) : status === "loading" ? (
          <span className="text-neutral-400">…</span>
        ) : (
          <>
            <Link href="/login" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded bg-neutral-900 px-3 py-1.5 text-white dark:bg-white dark:text-black"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
