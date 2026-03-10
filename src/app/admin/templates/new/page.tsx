/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";

type FeatureInput = {
  tempId: string;
  name: string;
  type: "price" | "option";
  weightPercent: number;
  options: { tempId: string; label: string; utilityValue: number }[];
};

const buildFeature = (): FeatureInput => ({
  tempId: crypto.randomUUID(),
  name: "",
  type: "option",
  weightPercent: 25,
  options: [{ tempId: crypto.randomUUID(), label: "", utilityValue: 50 }],
});

export default function NewTemplatePage() {
  return (
    <AuthGuard>
      <NewTemplateForm />
    </AuthGuard>
  );
}

function NewTemplateForm() {
  const { user } = db.useAuth();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [features, setFeatures] = useState<FeatureInput[]>([buildFeature()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const weightTotal = useMemo(
    () => features.reduce((sum, feature) => sum + Number(feature.weightPercent || 0), 0),
    [features],
  );

  const addFeature = () => setFeatures((prev) => [...prev, buildFeature()]);

  const updateFeature = (tempId: string, patch: Partial<FeatureInput>) =>
    setFeatures((prev) => prev.map((feature) => (feature.tempId === tempId ? { ...feature, ...patch } : feature)));

  const addOption = (tempId: string) =>
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.tempId === tempId
          ? {
              ...feature,
              options: [...feature.options, { tempId: crypto.randomUUID(), label: "", utilityValue: 50 }],
            }
          : feature,
      ),
    );

  const updateOption = (
    featureTempId: string,
    optionTempId: string,
    patch: Partial<{ label: string; utilityValue: number }>,
  ) =>
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.tempId === featureTempId
          ? {
              ...feature,
              options: feature.options.map((option) =>
                option.tempId === optionTempId ? { ...option, ...patch } : option,
              ),
            }
          : feature,
      ),
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const templateId = crypto.randomUUID();
      const txSteps: any[] = [
        db.tx.negotiationTemplates[templateId].update({
          name,
          topic,
          createdAt: new Date(),
          createdByUserId: user.id,
        }),
      ];

      for (const feature of features) {
        const featureId = crypto.randomUUID();
        txSteps.push(
          db.tx.templateFeatures[featureId].update({
            templateId,
            name: feature.name,
            type: feature.type,
            weightPercent: Number(feature.weightPercent),
            createdAt: new Date(),
          }),
        );
        for (const option of feature.options) {
          txSteps.push(
            db.tx.featureOptions[crypto.randomUUID()].update({
              featureId,
              label: option.label,
              utilityValue: Number(option.utilityValue),
              createdAt: new Date(),
            }),
          );
        }
      }

      await db.transact(txSteps);
      setMessage("Template created successfully.");
      setName("");
      setTopic("");
      setFeatures([buildFeature()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold">Create Negotiation Template</h1>
      <p className="mt-2 text-sm text-slate-600">
        Define product topic, template features, each option, and baseline utility weights.
      </p>
      <p className="mt-2 text-sm text-slate-700">Current total weight: {weightTotal}%</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Template name (e.g., Laptop Negotiation)"
          />
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Topic"
          />
        </div>

        {features.map((feature, idx) => (
          <div key={feature.tempId} className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-medium">Feature #{idx + 1}</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <input
                required
                value={feature.name}
                onChange={(e) => updateFeature(feature.tempId, { name: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2"
                placeholder="Feature name"
              />
              <select
                value={feature.type}
                onChange={(e) => updateFeature(feature.tempId, { type: e.target.value as "price" | "option" })}
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="option">Option Feature</option>
                <option value="price">Price Feature</option>
              </select>
              <input
                type="number"
                value={feature.weightPercent}
                onChange={(e) => updateFeature(feature.tempId, { weightPercent: Number(e.target.value) })}
                className="rounded-md border border-slate-300 px-3 py-2"
                placeholder="Weight %"
              />
            </div>

            <div className="mt-3 space-y-2">
              {feature.options.map((option, optionIndex) => (
                <div key={option.tempId} className="grid gap-2 md:grid-cols-3">
                  <input
                    required
                    value={option.label}
                    onChange={(e) => updateOption(feature.tempId, option.tempId, { label: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder={`Option #${optionIndex + 1} label`}
                  />
                  <input
                    type="number"
                    value={option.utilityValue}
                    onChange={(e) =>
                      updateOption(feature.tempId, option.tempId, { utilityValue: Number(e.target.value) })
                    }
                    className="rounded-md border border-slate-300 px-3 py-2"
                    placeholder="Utility value (0-100)"
                  />
                </div>
              ))}
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                onClick={() => addOption(feature.tempId)}
              >
                Add Option
              </button>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addFeature}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Add Feature
          </button>
          <button
            type="submit"
            disabled={saving || !name || !topic}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Template"}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
