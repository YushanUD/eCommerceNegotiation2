"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const { user } = db.useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await db.auth.sendMagicCode({ email });
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await db.auth.signInWithMagicCode({ email, code });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold">Login with Magic Code</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your email, receive a 6-digit code, then verify to sign in.
      </p>

      {user && (
        <p className="mt-4 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">
          Already signed in as {user.email}
        </p>
      )}

      <form onSubmit={handleSendCode} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Magic Code"}
        </button>
      </form>

      {codeSent && (
        <form onSubmit={handleVerify} className="mt-4 space-y-3">
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-md bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify and Login"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
