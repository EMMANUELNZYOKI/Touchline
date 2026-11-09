import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academy Admin Login | Touchline",
  description: "Sign in to manage your soccer academy's coaches, players, and evaluations.",
  robots: { index: false, follow: false },
};

export { default } from "@/routes/admin/login";
