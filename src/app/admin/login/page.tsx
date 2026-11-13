import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academy Owner Login | Touchline",
  description:
    "Academy owners sign in to manage settings, billing, branding, managers, coaches, players, and reports.",
  robots: { index: false, follow: false },
};

export { default } from "@/routes/admin/login";
