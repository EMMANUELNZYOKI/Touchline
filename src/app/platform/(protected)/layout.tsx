import type { ReactNode } from "react";
import { PlatformShell } from "@/routes/platform/_shell";

export default function PlatformProtectedLayout({ children }: { children: ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
