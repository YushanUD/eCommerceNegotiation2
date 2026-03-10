/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";

type AnyRecord = Record<string, any>;

export default function UserPreferencesPage() {
  return (
    <AuthGuard>
      <PreferencesForm />
    </AuthGuard>
  );
}

function PreferencesForm() {
  const { user } = db.useAuth();
  const templatesQuery: any = db.useQuery({ negotiationTemplates: {} } as any);
  const featuresQuery: any = db.useQuery({ templateFeatures: {} } as any);
  const optionsQuery: any = db.useQuery({ featureOptions: {} } as any);
  const prefQuery: any = db.useQuery({ userFeaturePrefs: {} } as any);
  const utilQuery: any = db.useQuery({ userOptionUtilities: {} } as any);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const templates = templatesQuery.data?.negotiationTemplates ?? [];
  const features = (featuresQuery.data?.templateFeatures ?? []).filter(
    (feature: AnyRecord) => feature.templateId === selectedTemplateId,
  );
  const options = useMemo(
    () => optionsQuery.data?.featureOptions ?? [],
    [optionsQuery.data?.featureOptions],
  );
  const myPrefs = (prefQuery.data?.userFeaturePrefs ?? []).filter((pref: AnyRecord) => pref.userId === user?.id);
  const myUtilities = (utilQuery.data?.userOptionUtilities ?? []).filter((item: AnyRecord) => item.userId === user?.id);

  const [weightsDraft, setWeightsDraft] = useState<Record<string, number>>({});
  const [optionUtilityDraft, setOptionUtilityDraft] = useState<Record<string, number>>({});

  const mappedWeight = useMemo(
    () =>
      features.reduce((acc: Record<string, number>, feature: AnyRecord) => {
        const saved = myPrefs.find((pref: AnyRecord) => pref.featureId === feature.id);
        acc[feature.id] = weightsDraft[feature.id] ?? saved?.weightPercent ?? feature.weightPercent ?? 0;
        return acc;
      }, {} as Record<string, number>),
    [features, myPrefs, weightsDraft],
  );

  const mappedOptionUtility = useMemo(
    () =>
      options.reduce((acc: Record<string, number>, option: AnyRecord) => {
        const saved = myUtilities.find((item: AnyRecord) => item.featureOptionId === option.id);
        acc[option.id] = optionUtilityDraft[option.id] ?? saved?.utilityValue ?? option.utilityValue ?? 0;
        return acc;
      }, {} as Record<string, number>),
    [myUtilities, optionUtilityDraft, options],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTemplateId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const txSteps: any[] = [];
      for (const feature of features) {
        const existing = myPrefs.find((pref: AnyRecord) => pref.featureId === feature.id);
        const id = existing?.id ?? crypto.randomUUID();
        txSteps.push(
          db.tx.userFeaturePrefs[id].update({
            userId: user.id,
            featureId: feature.id,
            weightPercent: Number(mappedWeight[feature.id] ?? 0),
            createdAt: existing?.createdAt ? new Date(existing.createdAt) : new Date(),
          }),
        );
      }

      for (const option of options.filter((item: AnyRecord) =>
        features.some((feature: AnyRecord) => feature.id === item.featureId),
      )) {
        const existing = myUtilities.find((item: AnyRecord) => item.featureOptionId === option.id);
        const id = existing?.id ?? crypto.randomUUID();
        txSteps.push(
          db.tx.userOptionUtilities[id].update({
            userId: user.id,
            featureOptionId: option.id,
            utilityValue: Number(mappedOptionUtility[option.id] ?? 0),
            createdAt: existing?.createdAt ? new Date(existing.createdAt) : new Date(),
          }),
        );
      }

      await db.transact(txSteps);
      setMessage("Preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const loading =
    templatesQuery.isLoading ||
    featuresQuery.isLoading ||
    optionsQuery.isLoading ||
    prefQuery.isLoading ||
    utilQuery.isLoading;
  const queryError =
    templatesQuery.error ||
    featuresQuery.error ||
    optionsQuery.error ||
    prefQuery.error ||
    utilQuery.error;

  if (loading) return <p>Loading preference data...</p>;
  if (queryError) return <p className="text-red-600">{queryError.message}</p>;

  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold">User Preferences</h1>
      <p className="text-sm text-slate-600">Set feature weights and utility values for each option.</p>

      <select
        value={selectedTemplateId}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 md:max-w-md"
      >
        <option value="">Select template</option>
        {templates.map((template: AnyRecord) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>

      {!!selectedTemplateId && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {features.map((feature: AnyRecord) => (
            <div key={feature.id} className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-medium">{feature.name}</h2>
              <div className="mt-2">
                <label className="text-sm text-slate-600">Weight Percent</label>
                <input
                  type="number"
                  value={mappedWeight[feature.id] ?? 0}
                  onChange={(e) =>
                    setWeightsDraft((prev) => ({ ...prev, [feature.id]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 md:max-w-xs"
                />
              </div>

              {options
                .filter((option: AnyRecord) => option.featureId === feature.id)
                .map((option: AnyRecord) => (
                  <div key={option.id} className="mt-2 grid items-center gap-2 md:grid-cols-2">
                    <p className="text-sm">{option.label}</p>
                    <input
                      type="number"
                      value={mappedOptionUtility[option.id] ?? 0}
                      onChange={(e) =>
                        setOptionUtilityDraft((prev) => ({
                          ...prev,
                          [option.id]: Number(e.target.value),
                        }))
                      }
                      className="rounded-md border border-slate-300 px-3 py-2"
                    />
                  </div>
                ))}
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      )}

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
