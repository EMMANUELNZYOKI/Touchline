import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academy Manager Login | Touchline",
  description:
    "Academy managers sign in to manage daily academy operations, players, coaches, evaluations, reports, and activity history.",
  robots: { index: false, follow: false },
};

export { default } from "@/routes/manager/login";
