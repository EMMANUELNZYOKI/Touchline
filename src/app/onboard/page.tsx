import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start an Academy Trial | Touchline",
  description: "Create your academy workspace and invite coaches to evaluate player development.",
  robots: { index: false, follow: false },
};

export { default } from "@/routes/onboard";
