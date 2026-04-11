import { cn } from "@/lib/utils";

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
};

function initialsFromName(name?: string | null): string {
  if (!name) {
    return "PT";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, src, size = 48, className }: AvatarProps): JSX.Element {
  const sizingStyle = { width: size, height: size };

  if (src) {
    return (
      // The image source is intentionally unconstrained while upload/storage policy is still pending.
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={name ?? "Profile avatar"} className={cn("rounded-full border border-border object-cover", className)} src={src} width={size} height={size} style={sizingStyle} />
    );
  }

  return (
    <span className={cn("inline-grid place-items-center rounded-full border border-border bg-background-soft font-semibold text-foreground", className)} style={sizingStyle}>
      {initialsFromName(name)}
    </span>
  );
}
