export function isPackageLimitError(error: unknown, resource?: "players" | "coaches") {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (resource === "players")
    return normalized.includes("allows up to") && normalized.includes("players");
  if (resource === "coaches") {
    return normalized.includes("allows up to") && normalized.includes("coach");
  }
  return (
    normalized.includes("allows up to") &&
    (normalized.includes("players") || normalized.includes("coach"))
  );
}
