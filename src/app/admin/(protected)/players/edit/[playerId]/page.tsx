import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Player | Touchline",
};

export { default } from "@/routes/admin/_shell/players.edit.$playerId";
