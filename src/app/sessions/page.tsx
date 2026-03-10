/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";
import { computeUserUtility, generateAgentOfferPayload } from "@/lib/negotiation";

type AnyRecord = Record<string, any>;

export default function SessionsPage() {
  return (
    <AuthGuard>
      <SessionsContent />
    </AuthGuard>
  );
}

function SessionsContent() {
  const { user } = db.useAuth();
  const templatesQuery: any = db.useQuery({ negotiationTemplates: {} } as any);
  const featuresQuery: any = db.useQuery({ templateFeatures: {} } as any);
  const optionsQuery: any = db.useQuery({ featureOptions: {} } as any);
  const agentsQuery: any = db.useQuery({ agentProfiles: {} } as any);
  const prefsQuery: any = db.useQuery({ userFeaturePrefs: {} } as any);
  const utilitiesQuery: any = db.useQuery({ userOptionUtilities: {} } as any);
  const sessionsQuery: any = db.useQuery({ negotiationSessions: {} } as any);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const templates = templatesQuery.data?.negotiationTemplates ?? [];
  const features = featuresQuery.data?.templateFeatures ?? [];
  const options = optionsQuery.data?.featureOptions ?? [];
  const agents = agentsQuery.data?.agentProfiles ?? [];
  const userPrefs = (prefsQuery.data?.userFeaturePrefs ?? []).filter((pref: AnyRecord) => pref.userId === user?.id);
  const userUtilities = (utilitiesQuery.data?.userOptionUtilities ?? []).filter((item: AnyRecord) => item.userId === user?.id);
  const sessions = (sessionsQuery.data?.negotiationSessions ?? [])
    .filter((session: AnyRecord) => session.userId === user?.id)
    .sort((a: AnyRecord, b: AnyRecord) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const loading =
    templatesQuery.isLoading ||
    featuresQuery.isLoading ||
    optionsQuery.isLoading ||
    agentsQuery.isLoading ||
    prefsQuery.isLoading ||
    utilitiesQuery.isLoading ||
    sessionsQuery.isLoading;
  const queryError =
    templatesQuery.error ||
    featuresQuery.error ||
    optionsQuery.error ||
    agentsQuery.error ||
    prefsQuery.error ||
    utilitiesQuery.error ||
    sessionsQuery.error;

  const startSession = async () => {
    if (!user || !selectedTemplateId) return;
    setCreating(true);
    setError("");
    try {
      const sessionId = crypto.randomUUID();
      const agent = agents.find((item: AnyRecord) => item.templateId === selectedTemplateId);
      if (!agent) {
        setError("Selected template does not have an agent profile yet.");
        return;
      }

      const templateFeatures = features.filter((feature: AnyRecord) => feature.templateId === selectedTemplateId);
      const templateOptions = options.filter((option: AnyRecord) =>
        templateFeatures.some((feature: AnyRecord) => feature.id === option.featureId),
      );

      const firstOfferPayload = generateAgentOfferPayload({
        features: templateFeatures,
        options: templateOptions,
        concessionType: agent.concessionType,
        round: 0,
      });

      const utility = computeUserUtility({
        payload: firstOfferPayload,
        features: templateFeatures,
        options: templateOptions,
        userFeaturePrefs: userPrefs,
        userOptionUtilities: userUtilities,
      });

      await db.transact([
        db.tx.negotiationSessions[sessionId].update({
          templateId: selectedTemplateId,
          userId: user.id,
          agentProfileId: agent.id,
          status: "active",
          finalOutcome: "",
          createdAt: new Date(),
          endedAt: new Date("1970-01-01"),
        }),
        db.tx.offers[crypto.randomUUID()].update({
          sessionId,
          senderType: "agent",
          priceValue: firstOfferPayload.priceValue,
          computedUtility: utility,
          payloadJson: JSON.stringify(firstOfferPayload),
          createdAt: new Date(),
        }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p>Loading sessions...</p>;
  if (queryError) return <p className="text-red-600">{queryError.message}</p>;

  return (
    <section className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">Negotiation Sessions</h1>
        <p className="mt-2 text-sm text-slate-600">
          Start a new session. The agent will generate the first offer immediately.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select template</option>
            {templates.map((template: AnyRecord) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={creating || !selectedTemplateId}
            onClick={startSession}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {creating ? "Creating..." : "Start Session"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="space-y-3">
        {sessions.map((session: AnyRecord) => (
          <article key={session.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">
              Created: {new Date(session.createdAt).toLocaleString()} | Status:{" "}
              <span className="font-medium">{session.status}</span>
            </p>
            <p className="text-sm text-slate-600">Outcome: {session.finalOutcome || "In progress"}</p>
            <div className="mt-2">
              <Link
                href={`/negotiate/${session.id}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                Open Session
              </Link>
            </div>
          </article>
        ))}
        {!sessions.length && (
          <p className="rounded-lg bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            No sessions yet.
          </p>
        )}
      </div>
    </section>
  );
}
