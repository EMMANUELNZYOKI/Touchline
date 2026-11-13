import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academy Owner or Manager Login | Touchline",
  description:
    "Owners and managers sign in to run their academy's players, coaches, evaluations, and reports.",
  robots: { index: false, follow: false },
};

export { default } from "@/routes/admin/login";
