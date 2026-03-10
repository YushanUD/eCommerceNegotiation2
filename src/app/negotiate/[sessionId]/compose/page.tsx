/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";
import { computeUserUtility, generateAgentOfferPayload } from "@/lib/negotiation";

type AnyRecord = Record<string, any>;

export default function ComposeOfferPage() {
  return (
    <AuthGuard>
      <ComposeForm />
    </AuthGuard>
  );
}

function ComposeForm() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const { user } = db.useAuth();
  const sessionsQuery: any = db.useQuery({ negotiationSessions: {} } as any);
  const featuresQuery: any = db.useQuery({ templateFeatures: {} } as any);
  const optionsQuery: any = db.useQuery({ featureOptions: {} } as any);
  const offersQuery: any = db.useQuery({ offers: {} } as any);
  const prefsQuery: any = db.useQuery({ userFeaturePrefs: {} } as any);
  const utilitiesQuery: any = db.useQuery({ userOptionUtilities: {} } as any);
  const agentsQuery: any = db.useQuery({ agentProfiles: {} } as any);

  const session = (sessionsQuery.data?.negotiationSessions ?? []).find(
    (item: AnyRecord) => item.id === sessionId && item.userId === user?.id,
  );
  const features = (featuresQuery.data?.templateFeatures ?? []).filter(
    (feature: AnyRecord) => feature.templateId === session?.templateId,
  );
  const options = optionsQuery.data?.featureOptions ?? [];
  const offers = (offersQuery.data?.offers ?? []).filter((offer: AnyRecord) => offer.sessionId === sessionId);
  const agent = (agentsQuery.data?.agentProfiles ?? []).find((item: AnyRecord) => item.id === session?.agentProfileId);
  const userPrefs = (prefsQuery.data?.userFeaturePrefs ?? []).filter((pref: AnyRecord) => pref.userId === user?.id);
  const userUtilities = (utilitiesQuery.data?.userOptionUtilities ?? []).filter((item: AnyRecord) => item.userId === user?.id);

  const [priceValue, setPriceValue] = useState(900);
  const [selectionDraft, setSelectionDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const optionFeatures = useMemo(
    () => features.filter((feature: AnyRecord) => feature.type === "option"),
    [features],
  );
  const selectedOptionsByFeatureId = optionFeatures.reduce((acc: Record<string, string>, feature: AnyRecord) => {
    const firstOption = options.find((option: AnyRecord) => option.featureId === feature.id);
    acc[feature.id] = selectionDraft[feature.id] ?? firstOption?.id ?? "";
    return acc;
  }, {} as Record<string, string>);

  const loading =
    sessionsQuery.isLoading ||
    featuresQuery.isLoading ||
    optionsQuery.isLoading ||
    offersQuery.isLoading ||
    prefsQuery.isLoading ||
    utilitiesQuery.isLoading ||
    agentsQuery.isLoading;
  const queryError =
    sessionsQuery.error ||
    featuresQuery.error ||
    optionsQuery.error ||
    offersQuery.error ||
    prefsQuery.error ||
    utilitiesQuery.error ||
    agentsQuery.error;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !agent) return;
    setSaving(true);
    setError("");
    try {
      const userPayload = { selectedOptionsByFeatureId, priceValue };
      const userUtility = computeUserUtility({
        payload: userPayload,
        features,
        options,
        userFeaturePrefs: userPrefs,
        userOptionUtilities: userUtilities,
      });

      const agentRound = offers.filter((offer: AnyRecord) => offer.senderType === "agent").length;
      const agentPayload = generateAgentOfferPayload({
        features,
        options,
        concessionType: agent.concessionType,
        round: agentRound,
      });
      const agentUtilityForUser = computeUserUtility({
        payload: agentPayload,
        features,
        options,
        userFeaturePrefs: userPrefs,
        userOptionUtilities: userUtilities,
      });

      await db.transact([
        db.tx.offers[crypto.randomUUID()].update({
          sessionId: session.id,
          senderType: "user",
          priceValue,
          computedUtility: userUtility,
          payloadJson: JSON.stringify(userPayload),
          createdAt: new Date(),
        }),
        db.tx.offers[crypto.randomUUID()].update({
          sessionId: session.id,
          senderType: "agent",
          priceValue: agentPayload.priceValue,
          computedUtility: agentUtilityForUser,
          payloadJson: JSON.stringify(agentPayload),
          createdAt: new Date(),
        }),
      ]);
      router.push(`/negotiate/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit offer.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading compose form...</p>;
  if (queryError) return <p className="text-red-600">{queryError.message}</p>;
  if (!session || session.status !== "active") return <p>Session not active or unavailable.</p>;

  return (
    <section className="max-w-3xl rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold">Compose Counter Offer</h1>
      <p className="mt-2 text-sm text-slate-600">Choose one option per feature and propose a price.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {optionFeatures.map((feature: AnyRecord) => (
          <div key={feature.id}>
            <label className="mb-1 block text-sm font-medium">{feature.name}</label>
            <select
              value={selectedOptionsByFeatureId[feature.id] ?? ""}
              onChange={(e) => setSelectionDraft((prev) => ({ ...prev, [feature.id]: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {options
                .filter((option: AnyRecord) => option.featureId === feature.id)
                .map((option: AnyRecord) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
        ))}

        <div>
          <label className="mb-1 block text-sm font-medium">Price: ${priceValue}</label>
          <input
            type="range"
            min={200}
            max={2000}
            step={10}
            value={priceValue}
            onChange={(e) => setPriceValue(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Submitting..." : "Submit Counter Offer"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
