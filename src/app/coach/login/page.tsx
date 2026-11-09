import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coach Sign In | Touchline",
  description:
    "Coaches sign in to register players, complete evaluations and track development at Touchline.",
  robots: { index: false, follow: false },
};

export { default } from "@/routes/coach/login";
