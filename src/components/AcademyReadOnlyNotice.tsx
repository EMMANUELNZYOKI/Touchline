"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { fetchMyAcademySubscription } from "@/lib/api";
import { Link } from "@/lib/next-router-compat";

export function AcademyReadOnlyNotice({ userId }: { userId?: string }) {
  const { data: subscription } = useQuery({
    queryKey: ["academy-subscription", userId],
    queryFn: () => fetchMyAcademySubscription(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (subscription === undefined) return null;

  const trialEnd = subscription?.trial_ends_at ? Date.parse(subscription.trial_ends_at) : null;
  const trialActive =
    subscription?.status === "trialing" && trialEnd !== null && trialEnd > Date.now();
  if (subscription?.status === "active") return null;

  if (trialActive && trialEnd !== null) {
    return (
      <div
        role="status"
        className="mb-5 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm"
      >
        <CalendarClock className="text-primary mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Your 14-day starter trial is active</p>
          <p className="text-muted-foreground mt-1">
            Trial ends {new Date(trialEnd).toLocaleDateString()}. The workspace becomes read-only
            after that unless Touchline activates a subscription.
          </p>
        </div>
      </div>
    );
  }

  const trialExpired = subscription?.status === "trialing";
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div>
        <p className="font-semibold">
          {trialExpired ? "Your 14-day trial has ended" : "Your subscription is not active"}
        </p>
        <p className="mt-1 text-muted-foreground">
          This workspace is read-only. You can view academy records, but adding or changing players,
          coaches, and evaluations is blocked until Touchline activates the subscription.
        </p>
        <Link
          to="/admin/settings"
          className="text-primary mt-3 inline-flex font-semibold underline underline-offset-4"
        >
          Choose a package and reactivate workspace
        </Link>
      </div>
    </div>
  );
}
