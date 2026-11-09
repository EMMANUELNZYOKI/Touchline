import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Users, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, LoadingBlock } from "@/components/DataCards";
import { fetchCoaches } from "@/lib/api";
import { setCoachActive, updateAcademyCoach } from "@/lib/admin.functions";
import type { Coach } from "@/lib/types";

export const Route = createFileRoute("/admin/_shell/coaches/")({
  head: () => ({ meta: [{ title: "Coach Management | Touchline" }] }),
  component: CoachesPage,
});

function CoachesPage() {
  const queryClient = useQueryClient();
  const toggleActive = useServerFn(setCoachActive);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Coach | null>(null);
  const [confirming, setConfirming] = useState<Coach | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["coaches"], queryFn: fetchCoaches });

  const toggleMutation = useMutation({
    mutationFn: (coach: Coach) =>
      toggleActive({ data: { coachId: coach.id, isActive: !coach.is_active } }),
    onSuccess: (_, coach) => {
      toast.success(`Coach ${coach.is_active ? "deactivated" : "activated"}`);
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      setConfirming(null);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Action failed"),
  });

  if (isLoading) return <LoadingBlock label="Loading coaches…" />;

  const coaches = (data ?? []) as Coach[];
  const filtered = coaches.filter((c) =>
    `${c.full_name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide uppercase">Coaches</h1>
          <p className="text-muted-foreground text-sm">
            {coaches.length} coach account{coaches.length === 1 ? "" : "s"} in the academy
          </p>
        </div>
        <Button asChild className="tracking-wider uppercase">
          <Link to="/admin/coaches/create">+ Create Coach</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Search coaches…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {coaches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No coaches yet"
          description="Create the first coach account so players can be registered and evaluated."
          action={
            <Button asChild>
              <Link to="/admin/coaches/create">+ Create Coach</Link>
            </Button>
          }
        />
      ) : (
        <Card className="border-border/70 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Players assigned</TableHead>
                    <TableHead className="text-center">Players evaluated</TableHead>
                    <TableHead className="text-center">Evaluations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell className="font-medium">{coach.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{coach.email}</TableCell>
                      <TableCell className="text-muted-foreground">{coach.phone || "—"}</TableCell>
                      <TableCell className="text-center">{coach.playerCount}</TableCell>
                      <TableCell className="text-center">{coach.evaluatedPlayerCount}</TableCell>
                      <TableCell className="text-center">{coach.evaluationCount}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            coach.is_active
                              ? "bg-accent/15 text-accent border-accent/30"
                              : "bg-destructive/15 text-destructive border-destructive/30"
                          }
                        >
                          {coach.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(coach.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/admin/coaches/$coachId" params={{ coachId: coach.id }}>
                              View
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(coach)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={coach.is_active ? "destructive" : "default"}
                            onClick={() => setConfirming(coach)}
                          >
                            {coach.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                        No coaches match “{search}”.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <EditCoachDialog coach={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming?.is_active ? "Deactivate" : "Activate"} {confirming?.full_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.is_active
                ? "This coach will immediately lose access to the portal. Their players and evaluations are kept."
                : "This coach will regain access to the portal with their existing credentials."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirming) toggleMutation.mutate(confirming);
              }}
            >
              {toggleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditCoachDialog({ coach, onClose }: { coach: Coach | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const updateCoach = useServerFn(updateAcademyCoach);
  const [fullName, setFullName] = useState(coach?.full_name ?? "");
  const [phone, setPhone] = useState(coach?.phone ?? "");
  const [key, setKey] = useState(coach?.id);

  if (coach && key !== coach.id) {
    setKey(coach.id);
    setFullName(coach.full_name);
    setPhone(coach.phone ?? "");
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateCoach({
        data: {
          coachId: coach!.id,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Coach details updated");
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      onClose();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  return (
    <Dialog open={!!coach} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide uppercase">Edit coach</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Full name</Label>
            <Input
              id="edit-name"
              required
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              maxLength={40}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Email (cannot be changed)</Label>
            <Input value={coach?.email ?? ""} disabled />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
