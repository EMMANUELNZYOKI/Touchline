import type { ReactNode } from "react";
import { AdminShell } from "@/routes/admin/_shell";

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
