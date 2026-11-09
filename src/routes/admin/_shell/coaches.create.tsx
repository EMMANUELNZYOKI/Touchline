import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCoachAccount } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/_shell/coaches/create")({
  head: () => ({ meta: [{ title: "Create Coach Account | Touchline" }] }),
  component: CreateCoachPage,
});

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CreateCoachPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createCoach = useServerFn(createCoachAccount);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Temporary password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await createCoach({
        data: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        },
      });
      toast.success("Coach account created successfully.");
      queryClient.invalidateQueries({ queryKey: ["coaches"] });
      navigate({ to: "/admin/coaches" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the coach account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/admin/coaches"
        className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to coaches
      </Link>

      <Card className="bg-gradient-panel border-border/70 shadow-elevated">
        <CardHeader>
          <span className="bg-primary/15 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <CardTitle className="font-display mt-3 text-2xl tracking-wide uppercase">
            Create coach account
          </CardTitle>
          <CardDescription>
            The coach signs in with the email and temporary password you set here. Share the
            credentials with them directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Otieno"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@academy.example"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                maxLength={40}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={() => setPassword(randomPassword())}>
                  Generate
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Minimum 8 characters. The coach should change it after first sign-in.
              </p>
            </div>
            <Button type="submit" className="mt-2 h-12 tracking-widest uppercase" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Coach Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
