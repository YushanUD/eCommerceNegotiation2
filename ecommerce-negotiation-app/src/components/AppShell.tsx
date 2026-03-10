"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/db";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/admin/templates", label: "Admin Templates" },
  { href: "/admin/templates/new", label: "New Template" },
  { href: "/admin/agents/new", label: "New Agent" },
  { href: "/user/profile", label: "User Profile" },
  { href: "/user/preferences", label: "Preferences" },
  { href: "/sessions", label: "Sessions" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = db.useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-semibold text-indigo-700">
            NegotiateX
          </Link>
          <nav className="flex flex-1 flex-wrap gap-2">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    active ? "bg-indigo-100 text-indigo-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            {isLoading && <span className="text-slate-500">Checking auth...</span>}
            {!isLoading && !user && (
              <Link href="/login" className="rounded-md bg-indigo-600 px-3 py-1.5 text-white">
                Login
              </Link>
            )}
            {!isLoading && user && (
              <>
                <span className="max-w-[220px] truncate text-slate-600">{user.email}</span>
                <button
                  type="button"
                  onClick={() => db.auth.signOut()}
                  className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
