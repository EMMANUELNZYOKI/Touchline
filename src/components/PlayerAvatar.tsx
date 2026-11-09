import { useEffect, useState } from "react";
import { photoUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export function PlayerAvatar({
  path,
  name,
  className,
}: {
  path: string | null;
  name: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    photoUrl(path)
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [path]);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground ring-border/70 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold ring-1",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
