/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";

type AnyRecord = Record<string, any>;

export default function AdminTemplatesPage() {
  return (
    <AuthGuard>
      <TemplatesContent />
    </AuthGuard>
  );
}

function TemplatesContent() {
  const templatesQuery: any = db.useQuery({ negotiationTemplates: {} } as any);
  const featuresQuery: any = db.useQuery({ templateFeatures: {} } as any);
  const agentsQuery: any = db.useQuery({ agentProfiles: {} } as any);

  if (templatesQuery.isLoading || featuresQuery.isLoading || agentsQuery.isLoading) {
    return <p>Loading templates...</p>;
  }

  if (templatesQuery.error || featuresQuery.error || agentsQuery.error) {
    return (
      <p className="text-red-600">
        Failed to load templates:{" "}
        {templatesQuery.error?.message || featuresQuery.error?.message || agentsQuery.error?.message}
      </p>
    );
  }

  const templates = templatesQuery.data?.negotiationTemplates ?? [];
  const features = featuresQuery.data?.templateFeatures ?? [];
  const agents = agentsQuery.data?.agentProfiles ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Negotiation Templates</h1>
        <Link href="/admin/templates/new" className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white">
          Create Template
        </Link>
      </div>

      {!templates.length && (
        <p className="rounded-lg bg-white p-4 text-slate-600 ring-1 ring-slate-200">
          No templates yet. Create one to begin.
        </p>
      )}

      <div className="grid gap-3">
        {templates.map((template: AnyRecord) => {
          const templateFeatures = features.filter((f: AnyRecord) => f.templateId === template.id);
          const templateAgent = agents.find((a: AnyRecord) => a.templateId === template.id);
          return (
            <article key={template.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold">{template.name}</h2>
              <p className="text-sm text-slate-600">Topic: {template.topic}</p>
              <p className="mt-2 text-sm text-slate-600">
                Features: {templateFeatures.length} | Agent: {templateAgent ? templateAgent.name : "Not set"}
              </p>
              <div className="mt-3 flex gap-2">
                <Link href="/admin/agents/new" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                  Configure Agent
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
