import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Profile | Touchline",
};

export { default } from "@/routes/coach/_shell/players.$playerId.index";
