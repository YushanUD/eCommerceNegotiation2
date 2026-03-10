"use client";

import Link from "next/link";
import { db } from "@/lib/db";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, error, user } = db.useAuth();

  if (isLoading) {
    return <p className="rounded-lg bg-white p-4 text-slate-600">Loading account...</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Auth error: {error.message}
      </p>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <p className="mb-2">Please log in to access this page.</p>
        <Link href="/login" className="font-medium underline">
          Go to Login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
