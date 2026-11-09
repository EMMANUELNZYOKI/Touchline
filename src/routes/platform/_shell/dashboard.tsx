"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { useMemo, useState } from "react";

import { useServerFn } from "@/lib/next-server-fn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CircleAlert,
  ClipboardCheck,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createPlatformAcademy,
  getPlatformAcademies,
  updatePlatformAcademy,
  type PlatformAcademy,
} from "@/lib/platform.functions";

export const Route = createFileRoute("/platform/_shell/dashboard")({
  head: () => ({ meta: [{ title: "Academies | Touchline Platform" }] }),
  component: PlatformDashboard,
});

type AcademyDraft = Pick<PlatformAcademy, "academy_status" | "subscription_status">;
const subscriptionStatuses: PlatformAcademy["subscription_status"][] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
];

function PlatformDashboard() {
  const queryClient = useQueryClient();
  const getAcademies = useServerFn(getPlatformAcademies);
  const saveAcademy = useServerFn(updatePlatformAcademy);
  const provisionAcademy = useServerFn(createPlatformAcademy);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, AcademyDraft>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [academyName, setAcademyName] = useState("");
  const [academySlug, setAcademySlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const query = useQuery({
    queryKey: ["platform-academies"],
    queryFn: () => getAcademies(),
  });
  const update = useMutation({
    mutationFn: (input: {
      academyId: string;
      academyStatus: AcademyDraft["academy_status"];
      subscriptionStatus: AcademyDraft["subscription_status"];
    }) => saveAcademy({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform-academies"] });
    },
  });
  const create = useMutation({
    mutationFn: (input: { name: string; slug: string }) => provisionAcademy({ data: input }),
    onSuccess: async () => {
      setAcademyName("");
      setAcademySlug("");
      setSlugEdited(false);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["platform-academies"] });
    },
  });

  const academies = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return academies;
    return academies.filter((academy) =>
      `${academy.academy_name} ${academy.slug} ${academy.plan_key}`.toLowerCase().includes(term),
    );
  }, [academies, search]);
  const activeSubscriptions = academies.filter(
    (academy) => academy.subscription_status === "active",
  ).length;
  const trialing = academies.filter((academy) => academy.subscription_status === "trialing").length;
  const totalPlayers = academies.reduce(
    (sum, academy) => sum + Number(academy.player_count || 0),
    0,
  );
  const totalEvaluations = academies.reduce(
    (sum, academy) => sum + Number(academy.evaluation_count || 0),
    0,
  );

  const changeDraft = (academy: PlatformAcademy, patch: Partial<AcademyDraft>) => {
    setDrafts((current) => ({
      ...current,
      [academy.academy_id]: {
        academy_status: current[academy.academy_id]?.academy_status ?? academy.academy_status,
        subscription_status:
          current[academy.academy_id]?.subscription_status ?? academy.subscription_status,
        ...patch,
      },
    }));
  };

  const save = (academy: PlatformAcademy) => {
    const draft = drafts[academy.academy_id] ?? {
      academy_status: academy.academy_status,
      subscription_status: academy.subscription_status,
    };
    update.mutate({
      academyId: academy.academy_id,
      academyStatus: draft.academy_status,
      subscriptionStatus: draft.subscription_status,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            Touchline control center
          </p>
          <h1 className="font-display mt-2 text-3xl tracking-wide uppercase sm:text-4xl">
            Academies
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            View customer academies, subscription state, and top-line product usage. Academy player
            records remain tenant-isolated.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="gap-2"
          >
            {query.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}{" "}
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen((open) => !open)} className="gap-2">
            <Plus className="h-4 w-4" /> Add academy
          </Button>
        </div>
      </div>

      {createOpen && (
        <Card className="bg-gradient-panel border-border/70">
          <CardContent className="p-5">
            <div className="mb-4">
              <h2 className="font-display text-lg tracking-wide uppercase">Provision an academy</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Creates an active workspace with a starter trial record. Add an academy
                administrator separately after account invitation is implemented.
              </p>
            </div>
            <form
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate({ name: academyName.trim(), slug: academySlug.trim() });
              }}
            >
              <label className="grid gap-2 text-xs font-medium">
                Academy name
                <Input
                  required
                  minLength={2}
                  maxLength={160}
                  value={academyName}
                  onChange={(event) => {
                    const name = event.target.value;
                    setAcademyName(name);
                    if (!slugEdited) {
                      setAcademySlug(
                        name
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                    }
                  }}
                  placeholder="Northside Soccer Academy"
                />
              </label>
              <label className="grid gap-2 text-xs font-medium">
                Workspace slug
                <Input
                  required
                  maxLength={80}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={academySlug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setAcademySlug(event.target.value.toLowerCase());
                  }}
                  placeholder="northside-soccer-academy"
                />
              </label>
              <Button
                type="submit"
                disabled={create.isPending || !academyName.trim() || !academySlug.trim()}
              >
                {create.isPending ? "Creating…" : "Create trial"}
              </Button>
            </form>
            {create.error && (
              <p className="text-destructive mt-3 text-xs">
                {create.error instanceof Error ? create.error.message : "Could not create academy."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {query.error && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border p-4 text-sm">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Could not load platform data</p>
            <p className="mt-1">
              {query.error instanceof Error
                ? query.error.message
                : "Check Supabase configuration and confirm the tenant migration is applied."}
            </p>
          </div>
        </div>
      )}
      {update.error && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
          {update.error instanceof Error ? update.error.message : "Could not update academy."}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Total academies"
          value={academies.length}
          note="Customer workspaces"
        />
        <MetricCard
          icon={CreditCard}
          label="Active subscriptions"
          value={activeSubscriptions}
          note={`${trialing} currently trialing`}
        />
        <MetricCard
          icon={UsersRound}
          label="Players managed"
          value={totalPlayers}
          note="Across all academies"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Evaluations logged"
          value={totalEvaluations}
          note="Across all academies"
        />
      </div>

      <Card className="bg-gradient-panel border-border/70">
        <CardContent className="p-0">
          <div className="border-border/70 flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg tracking-wide uppercase">Academy accounts</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Platform-only view of customer and subscription metadata.
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search academies"
                className="pl-9"
              />
            </div>
          </div>
          {query.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 p-8 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading academy overview…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground p-8 text-sm">
              {academies.length
                ? "No academies match that search."
                : "No academies have been provisioned yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="text-muted-foreground bg-muted/30 text-[11px] tracking-wider uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">Academy</th>
                    <th className="px-4 py-3 font-medium">Usage</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Subscription</th>
                    <th className="px-4 py-3 font-medium">Workspace</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-5 py-3 text-right font-medium">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-border/60 divide-y">
                  {filtered.map((academy) => {
                    const draft = drafts[academy.academy_id] ?? {
                      academy_status: academy.academy_status,
                      subscription_status: academy.subscription_status,
                    };
                    const dirty =
                      draft.academy_status !== academy.academy_status ||
                      draft.subscription_status !== academy.subscription_status;
                    return (
                      <tr key={academy.academy_id} className="hover:bg-muted/20">
                        <td className="px-5 py-4">
                          <p className="font-medium">{academy.academy_name}</p>
                          <p className="text-muted-foreground mt-1 text-xs">{academy.slug}</p>
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-xs">
                          {academy.player_count} players
                          <br />
                          {academy.evaluation_count} evaluations · {academy.coach_count} coaches
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-muted rounded-md px-2 py-1 text-xs capitalize">
                            {academy.plan_key}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <StatusSelect
                            label="Subscription status"
                            value={draft.subscription_status}
                            options={subscriptionStatuses}
                            onChange={(value) =>
                              changeDraft(academy, { subscription_status: value })
                            }
                          />
                        </td>
                        <td className="px-4 py-4">
                          <StatusSelect
                            label="Workspace status"
                            value={draft.academy_status}
                            options={["active", "suspended"]}
                            onChange={(value) => changeDraft(academy, { academy_status: value })}
                          />
                        </td>
                        <td className="text-muted-foreground px-4 py-4 text-xs">
                          {new Date(academy.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            disabled={!dirty || update.isPending}
                            onClick={() => save(academy)}
                          >
                            {update.isPending ? "Saving…" : "Save"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-muted-foreground text-xs">
        Counts are aggregated by a server-only RPC. This dashboard does not expose player names,
        medical notes, or evaluation details.
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Card className="bg-gradient-panel border-border/70">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {label}
          </p>
          <span className="bg-primary/15 text-primary rounded-lg p-2">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display mt-4 text-3xl">{value.toLocaleString()}</p>
        <p className="text-muted-foreground mt-1 text-xs">{note}</p>
      </CardContent>
    </Card>
  );
}

function StatusSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="border-input bg-background focus:ring-ring rounded-md border px-2 py-1.5 text-xs capitalize focus:ring-2 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option} className="capitalize">
          {option.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

export default Route.component;
