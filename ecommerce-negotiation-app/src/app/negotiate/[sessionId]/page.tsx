/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { db } from "@/lib/db";
import { parsePayload } from "@/lib/negotiation";

type AnyRecord = Record<string, any>;

export default function NegotiationSessionPage() {
  return (
    <AuthGuard>
      <SessionContent />
    </AuthGuard>
  );
}

function SessionContent() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { user } = db.useAuth();
  const sessionsQuery: any = db.useQuery({ negotiationSessions: {} } as any);
  const offersQuery: any = db.useQuery({ offers: {} } as any);
  const featuresQuery: any = db.useQuery({ templateFeatures: {} } as any);
  const optionsQuery: any = db.useQuery({ featureOptions: {} } as any);

  const sessions = sessionsQuery.data?.negotiationSessions ?? [];
  const offers = (offersQuery.data?.offers ?? [])
    .filter((offer: AnyRecord) => offer.sessionId === sessionId)
    .sort((a: AnyRecord, b: AnyRecord) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const session = sessions.find((item: AnyRecord) => item.id === sessionId && item.userId === user?.id);
  const features = (featuresQuery.data?.templateFeatures ?? []).filter(
    (feature: AnyRecord) => feature.templateId === session?.templateId,
  );
  const options = optionsQuery.data?.featureOptions ?? [];

  const loading =
    sessionsQuery.isLoading || offersQuery.isLoading || featuresQuery.isLoading || optionsQuery.isLoading;
  const queryError = sessionsQuery.error || offersQuery.error || featuresQuery.error || optionsQuery.error;

  const closeSession = async (status: "accepted" | "ended") => {
    if (!session) return;
    const finalOffer = offers.at(-1);
    const outcome =
      status === "accepted"
        ? `Accepted ${finalOffer?.senderType ?? "offer"} offer with utility ${finalOffer?.computedUtility ?? 0}`
        : "Negotiation manually ended by user";
    await db.transact(
      db.tx.negotiationSessions[session.id].update({
        ...session,
        status,
        finalOutcome: outcome,
        endedAt: new Date(),
      }),
    );
  };

  if (loading) return <p>Loading session...</p>;
  if (queryError) return <p className="text-red-600">{queryError.message}</p>;
  if (!session) return <p className="text-slate-600">Session not found or access denied.</p>;

  return (
    <section className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold">Session {session.id.slice(0, 8)}</h1>
        <p className="mt-1 text-sm text-slate-600">Status: {session.status}</p>
        <p className="text-sm text-slate-600">Outcome: {session.finalOutcome || "In progress"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/negotiate/${session.id}/compose`}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white"
          >
            Compose Counter Offer
          </Link>
          <button
            type="button"
            onClick={() => closeSession("accepted")}
            disabled={session.status !== "active"}
            className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700 disabled:opacity-50"
          >
            Accept Current Offer
          </button>
          <button
            type="button"
            onClick={() => closeSession("ended")}
            disabled={session.status !== "active"}
            className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 disabled:opacity-50"
          >
            End Negotiation
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {offers.map((offer: AnyRecord, idx: number) => {
          const payload = parsePayload(offer.payloadJson);
          return (
            <article key={offer.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-600">
                #{idx + 1} {offer.senderType.toUpperCase()} | Price ${offer.priceValue} | Utility{" "}
                {offer.computedUtility}
              </p>
              <div className="mt-2 text-sm text-slate-700">
                {features
                  .filter((feature: AnyRecord) => feature.type === "option")
                  .map((feature: AnyRecord) => {
                    const selectedId = payload.selectedOptionsByFeatureId?.[feature.id];
                    const selected = options.find((option: AnyRecord) => option.id === selectedId);
                    return (
                      <p key={feature.id}>
                        {feature.name}: {selected?.label ?? "N/A"}
                      </p>
                    );
                  })}
              </div>
              <p className="mt-1 text-xs text-slate-500">{new Date(offer.createdAt).toLocaleString()}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
