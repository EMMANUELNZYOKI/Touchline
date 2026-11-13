export function isPackageLimitError(error: unknown, resource?: "players" | "coaches" | "managers") {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (resource === "players")
    return normalized.includes("allows up to") && normalized.includes("players");
  if (resource === "coaches") {
    return normalized.includes("allows up to") && normalized.includes("coach");
  }
  if (resource === "managers") {
    return normalized.includes("allows up to") && normalized.includes("manager");
  }
  return (
    normalized.includes("allows up to") &&
    (normalized.includes("players") || normalized.includes("coach"))
  );
}
