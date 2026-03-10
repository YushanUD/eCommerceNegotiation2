/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";

type AnyRecord = Record<string, any>;

export default function UserProfilePage() {
  return (
    <AuthGuard>
      <ProfileForm />
    </AuthGuard>
  );
}

function ProfileForm() {
  const { user } = db.useAuth();
  const query: any = db.useQuery({ userProfiles: {} } as any);
  const myProfile = useMemo(
    () => (query.data?.userProfiles ?? []).find((profile: AnyRecord) => profile.id === user?.id || profile.userId === user?.id),
    [query.data?.userProfiles, user?.id],
  );

  const [fullName, setFullName] = useState(myProfile?.fullName ?? "");
  const [ageRange, setAgeRange] = useState(myProfile?.ageRange ?? "");
  const [gender, setGender] = useState(myProfile?.gender ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await db.transact(
        db.tx.userProfiles[user.id].update({
          fullName,
          ageRange,
          gender,
          createdAt: myProfile?.createdAt ? new Date(myProfile.createdAt) : new Date(),
        }),
      );
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) return <p>Loading profile...</p>;
  if (query.error) return <p className="text-red-600">{query.error.message}</p>;

  return (
    <section className="max-w-2xl rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold">User Demographic Profile</h1>
      <p className="mt-2 text-sm text-slate-600">
        This data is stored per account and used for personalization.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Full name"
        />
        <input
          required
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Age range (e.g., 25-34)"
        />
        <input
          required
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Gender"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
