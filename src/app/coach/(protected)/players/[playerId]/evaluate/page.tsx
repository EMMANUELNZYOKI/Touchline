import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaluate Player | Touchline",
};

export { default } from "@/routes/coach/_shell/players.$playerId.evaluate";
