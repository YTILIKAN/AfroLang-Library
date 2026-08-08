interface KenteBandProps {
  className?: string;
  height?: "thin" | "medium";
}

export function KenteBand({ className = "", height = "thin" }: KenteBandProps) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={`kente-band ${height === "medium" ? "kente-band-md" : ""} ${className}`.trim()}
    />
  );
}
