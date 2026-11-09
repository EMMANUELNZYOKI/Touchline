import type { ReactNode } from "react";
import { CoachShell } from "@/routes/coach/_shell";

export default function CoachProtectedLayout({ children }: { children: ReactNode }) {
  return <CoachShell>{children}</CoachShell>;
}
