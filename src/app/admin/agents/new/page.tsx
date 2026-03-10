/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";

type AnyRecord = Record<string, any>;

export default function NewAgentPage() {
  return (
    <AuthGuard>
      <NewAgentForm />
    </AuthGuard>
  );
}

function NewAgentForm() {
  const templatesQuery: any = db.useQuery({ negotiationTemplates: {} } as any);
  const agentsQuery: any = db.useQuery({ agentProfiles: {} } as any);
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("Auto Negotiator");
  const [avatarPreset, setAvatarPreset] = useState("assistant-blue");
  const [concessionType, setConcessionType] = useState<"linear" | "convex" | "concave">("linear");
  const [utilityFormulaText, setUtilityFormulaText] = useState("Weighted sum over feature utility and price utility");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const templates = useMemo(
    () => templatesQuery.data?.negotiationTemplates ?? [],
    [templatesQuery.data?.negotiationTemplates],
  );
  const existingAgents = useMemo(
    () => agentsQuery.data?.agentProfiles ?? [],
    [agentsQuery.data?.agentProfiles],
  );

  const availableTemplates = useMemo(
    () => templates.filter((template: AnyRecord) => !existingAgents.find((agent: AnyRecord) => agent.templateId === template.id)),
    [templates, existingAgents],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await db.transact(
        db.tx.agentProfiles[crypto.randomUUID()].update({
          templateId,
          name,
          avatarPreset,
          concessionType,
          utilityFormulaText,
          createdAt: new Date(),
        }),
      );
      setMessage("Agent profile created.");
      setTemplateId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent profile.");
    } finally {
      setSaving(false);
    }
  };

  if (templatesQuery.isLoading || agentsQuery.isLoading) return <p>Loading templates...</p>;
  if (templatesQuery.error || agentsQuery.error) {
    return <p className="text-red-600">{templatesQuery.error?.message || agentsQuery.error?.message}</p>;
  }

  return (
    <section className="max-w-2xl rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold">Create Agent Profile</h1>
      <p className="mt-2 text-sm text-slate-600">
        One agent profile per template with concession style and utility formula text.
      </p>

      {!availableTemplates.length ? (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          All templates already have an agent profile.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select
            required
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select template</option>
            {availableTemplates.map((template: AnyRecord) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Agent name"
          />
          <input
            required
            value={avatarPreset}
            onChange={(e) => setAvatarPreset(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Avatar preset"
          />
          <select
            value={concessionType}
            onChange={(e) => setConcessionType(e.target.value as "linear" | "convex" | "concave")}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="linear">Linear</option>
            <option value="convex">Convex</option>
            <option value="concave">Concave</option>
          </select>
          <textarea
            value={utilityFormulaText}
            onChange={(e) => setUtilityFormulaText(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            rows={4}
          />

          <button
            type="submit"
            disabled={saving || !templateId}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Agent"}
          </button>
        </form>
      )}

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
