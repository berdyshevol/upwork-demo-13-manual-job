import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Helpdesk Guidance Studio",
  description: "Classify support tickets, match guidance rules, and draft AI replies — BYOK demo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
            <Link href="/" className="font-semibold text-slate-900">AI Helpdesk Studio</Link>
            <span className="text-slate-300">|</span>
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Tickets</Link>
            <Link href="/rules" className="text-sm text-slate-600 hover:text-slate-900">Rules</Link>
            <Link href="/metrics" className="text-sm text-slate-600 hover:text-slate-900">Metrics</Link>
            <Link href="/settings" className="ml-auto text-sm text-slate-600 hover:text-slate-900">Settings</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
