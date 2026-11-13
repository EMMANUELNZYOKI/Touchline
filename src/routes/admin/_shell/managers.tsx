"use client";

import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingBlock } from "@/components/DataCards";
import { useAuth } from "@/lib/auth";
import { fetchAcademyManagers } from "@/lib/api";
import { createAcademyManager, setAcademyManagerActive } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/_shell/managers")({
  head: () => ({ meta: [{ title: "Managers | Touchline" }] }),
  component: ManagersPage,
});

type Manager = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
};

function ManagersPage() {
  const { role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const managersQuery = useQuery({
    queryKey: ["academy-managers"],
    queryFn: fetchAcademyManagers,
    enabled: role === "academy_admin",
  });
  const createMutation = useMutation({
    mutationFn: () =>
      createAcademyManager({
        data: { full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), password },
      }),
    onSuccess: () => {
      toast.success("Academy manager created. Share the temporary credentials securely.");
      queryClient.invalidateQueries({ queryKey: ["academy-managers"] });
      setOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create manager."),
  });
  const statusMutation = useMutation({
    mutationFn: (manager: Manager) =>
      setAcademyManagerActive({
        data: { managerId: manager.id, isActive: manager.status !== "active" },
      }),
    onSuccess: () => {
      toast.success("Manager access updated.");
      queryClient.invalidateQueries({ queryKey: ["academy-managers"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update manager."),
  });

  useEffect(() => {
    if (role === "academy_manager") router.replace("/admin/dashboard");
  }, [role, router]);

  if (role !== "academy_admin") return <LoadingBlock />;

  const managers = (managersQuery.data?.managers ?? []) as Manager[];
  const activeCount = managers.filter((manager) => manager.status === "active").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            Owner controls
          </p>
          <h1 className="font-display mt-2 text-3xl tracking-wide uppercase">Managers</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Create and manage the people who run your academy&apos;s daily operations.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add manager
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-base tracking-wide uppercase">
            {activeCount} active manager{activeCount === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {managersQuery.isLoading ? (
            <LoadingBlock label="Loading managers…" />
          ) : managers.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              No managers have been created yet. Add an Academy Manager to delegate daily
              operations.
            </p>
          ) : (
            managers.map((manager) => (
              <div
                key={manager.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/60 p-4 text-sm"
              >
                <div>
                  <p className="font-medium">{manager.full_name}</p>
                  <p className="text-muted-foreground">
                    {manager.email} · {manager.status === "active" ? "Active" : "Suspended"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={manager.status === "active" ? "destructive" : "outline"}
                  onClick={() => statusMutation.mutate(manager)}
                  disabled={statusMutation.isPending}
                >
                  {manager.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide uppercase">
              Create academy manager
            </DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="manager-name">Full name</Label>
              <Input
                id="manager-name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager-email">Email</Label>
              <Input
                id="manager-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager-phone">Phone</Label>
              <Input
                id="manager-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager-password">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="manager-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void navigator.clipboard?.writeText(password)}
                  disabled={!password}
                  aria-label="Copy temporary password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
              manager
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Route.component;
