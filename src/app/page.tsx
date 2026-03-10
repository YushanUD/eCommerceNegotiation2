"use client";

import Link from "next/link";
import { db } from "@/lib/db";

export default function Home() {
  const { user, isLoading } = db.useAuth();

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold">E-Commerce Negotiation Platform</h1>
        <p className="mt-2 text-slate-600">
          Admins configure product negotiation templates and a computer agent profile.
          Signed-in users set preferences, run offer exchanges, and close negotiations.
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {isLoading
            ? "Checking login status..."
            : user
              ? `Logged in as ${user.email}`
              : "You are currently signed out."}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Admin workflow</h2>
          <p className="mt-2 text-sm text-slate-600">
            Create templates, define features/options, and configure one agent per template.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white" href="/admin/templates">
              View Templates
            </Link>
            <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/admin/templates/new">
              New Template
            </Link>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">User workflow</h2>
          <p className="mt-2 text-sm text-slate-600">
            Set your profile/preferences, start sessions, counter with offers, and accept or end.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white" href="/sessions">
              Sessions
            </Link>
            <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm" href="/user/preferences">
              Preferences
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
