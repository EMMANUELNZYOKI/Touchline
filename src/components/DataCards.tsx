import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "accent" | "muted";
}

export function StatCard({ label, value, hint, icon: Icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="bg-gradient-panel border-border/70 shadow-elevated overflow-hidden">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            {label}
          </p>
          <p className="font-display mt-2 text-3xl leading-none">{value}</p>
          {hint && <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>}
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            tone === "primary" && "bg-primary/15 text-primary",
            tone === "accent" && "bg-accent/15 text-accent",
            tone === "muted" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function ScoreCard({
  label,
  score,
  max = 10,
}: {
  label: string;
  score: number | null | undefined;
  max?: number;
}) {
  const value = score ?? 0;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="border-border/70 bg-card rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
        <p className="font-display text-2xl">
          {score == null ? "—" : value.toFixed(1)}
          <span className="text-muted-foreground text-xs">/{max}</span>
        </p>
      </div>
      <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            value >= 7.5 ? "bg-accent" : value >= 5 ? "bg-primary" : "bg-destructive",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border-border/70 bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="bg-muted text-muted-foreground mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-display text-lg">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ label = "Loading academy data…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20">
      <span className="border-primary/30 border-t-primary h-6 w-6 animate-spin rounded-full border-2" />
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}
